import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';
import { userColors } from '../../../lib/utils/colorUtils.js';
import { defaultCodes } from '../../../constants/defaultCodes.js';
import { defaultDocuments } from '../../../constants/defaultDocuments.js';
import {
  formatResearchBackgroundForStorage,
  parseResearchBackgroundFromStorage
} from '../../../constants/researchBackground.js';
import { ResearchBackgroundSummaryService } from './researchBackgroundSummaryService.js';

const PROJECT_DATA_COLLECTIONS = [
  'documents',
  'codes',
  'highlights',
  'reflexive_responses',
  'code_history'
];

const PROJECT_METADATA_COLLECTIONS = [
  'member_secrets',
  'settings'
];

const bytesToBase64Url = (bytes) => {
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const bytesToHex = (bytes) => Array.from(bytes)
  .map(byte => byte.toString(16).padStart(2, '0'))
  .join('');

const pickColor = () => userColors[Math.floor(Math.random() * userColors.length)];

const buildProjectResearchBackground = (researchBackground, initialDataView = '') => {
  if (!researchBackground) return null;

  const parsed = parseResearchBackgroundFromStorage(researchBackground);
  return formatResearchBackgroundForStorage(
    parsed.qualitativeHistory,
    parsed.backgroundExperience,
    initialDataView
  );
};

const hasStoredInitialDataView = (researchBackground) => (
  Boolean(parseResearchBackgroundFromStorage(researchBackground || '').initialDataView.trim())
);

const buildMemberProfile = (user, userProfile, role) => {
  const initialDataView = '';

  return {
    userId: user.uid,
    role,
    color: pickColor(),
    name: userProfile?.name || user.displayName || user.email || 'Researcher',
    email: user.email || userProfile?.email || null,
    researchBackground: buildProjectResearchBackground(userProfile?.researchBackground, initialDataView),
    reducedResearchBackground: hasStoredInitialDataView(userProfile?.researchBackground)
      ? null
      : userProfile?.reducedResearchBackground || null,
    initialDataView,
    profileCompleted: !!userProfile?.profileCompleted,
    joinedAt: new Date()
  };
};

const addDefaultProjectContentToBatch = (batch, projectId, userId) => {
  defaultDocuments.forEach((defaultDocument) => {
    const documentRef = doc(db, 'projects', projectId, 'documents', defaultDocument.id);
    batch.set(documentRef, {
      title: defaultDocument.title,
      description: defaultDocument.description,
      content: defaultDocument.content,
      isDefault: true,
      createdAt: defaultDocument.createdAt || new Date(),
      createdBy: 'system'
    });
  });

  defaultCodes.forEach((defaultCode) => {
    const { docId, ...codeData } = defaultCode;
    const codeRef = doc(db, 'projects', projectId, 'codes', docId);
    batch.set(codeRef, {
      ...codeData,
      createdBy: userId,
      createdAt: new Date()
    });
  });
};

export class ProjectService {
  generateJoinKey() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return bytesToBase64Url(bytes);
  }

  async hashJoinKey(joinKey) {
    const normalizedKey = joinKey.trim();
    const data = new TextEncoder().encode(normalizedKey);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(digest));
  }

  onUserProjectsSnapshot(userId, callback) {
    const userProjectsQuery = query(collection(db, 'users', userId, 'projects'));

    return onSnapshot(
      userProjectsQuery,
      { includeMetadataChanges: true },
      async (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;

        const projects = await Promise.all(snapshot.docs.map(async (userProjectDoc) => {
          const projectId = userProjectDoc.id;
          const userProjectData = userProjectDoc.data() || {};
          const fallbackProject = {
            id: projectId,
            name: userProjectData.name || 'Untitled project',
            ownerId: userProjectData.role === 'owner' ? userId : null,
            membership: {
              userId,
              role: userProjectData.role || 'member',
              name: userProjectData.name || null
            },
            joinKey: null
          };

          try {
            const projectRef = doc(db, 'projects', projectId);

            const projectSnapshot = await getDoc(projectRef);
            if (!projectSnapshot.exists()) return null;

            const membershipSnapshot = await getDoc(doc(projectRef, 'members', userId));
            if (!membershipSnapshot.exists()) return null;

            const membership = membershipSnapshot.data();
            let inviteSettings = null;

            if (membership.role === 'owner') {
              const inviteSnapshot = await getDoc(doc(projectRef, 'settings', 'invite'));
              inviteSettings = inviteSnapshot.exists() ? inviteSnapshot.data() : null;
            }

            return {
              id: projectId,
              ...projectSnapshot.data(),
              membership,
              joinKey: inviteSettings?.joinKey || null
            };
          } catch (error) {
            console.warn('Using fallback project data after read error:', projectId, error);
            return fallbackProject;
          }
        }));

        callback(projects.filter(Boolean));
      },
      (error) => {
        console.error('Error loading projects:', error);
        callback([]);
      }
    );
  }

  async createProject({ name }, user, userProfile) {
    try {
      const trimmedName = name.trim();
      const projectRef = doc(collection(db, 'projects'));
      const joinKey = this.generateJoinKey();
      const joinKeyHash = await this.hashJoinKey(joinKey);
      const memberData = buildMemberProfile(user, userProfile, 'owner');

      const batch = writeBatch(db);
      batch.set(projectRef, {
        name: trimmedName,
        ownerId: user.uid,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      batch.set(doc(projectRef, 'members', user.uid), {
        ...memberData,
        projectId: projectRef.id
      });
      batch.set(doc(db, 'users', user.uid, 'projects', projectRef.id), {
        projectId: projectRef.id,
        role: 'owner',
        name: trimmedName,
        joinedAt: new Date()
      });
      batch.set(doc(projectRef, 'settings', 'invite'), {
        joinKeyHash,
        joinKey,
        updatedBy: user.uid,
        updatedAt: new Date()
      });
      batch.set(doc(db, 'project_join_keys', joinKeyHash), {
        projectId: projectRef.id,
        projectName: trimmedName,
        createdBy: user.uid,
        createdAt: new Date()
      });
      addDefaultProjectContentToBatch(batch, projectRef.id, user.uid);

      await batch.commit();

      return {
        success: true,
        defaultContentCreated: true,
        defaultContentError: null,
        project: {
          id: projectRef.id,
          name: trimmedName,
          ownerId: user.uid,
          membership: memberData,
          joinKey
        },
        joinKey
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error };
    }
  }

  async joinProjectByKey(joinKey, user, userProfile) {
    try {
      const joinKeyHash = await this.hashJoinKey(joinKey);
      const joinKeyRef = doc(db, 'project_join_keys', joinKeyHash);
      const joinKeySnapshot = await getDoc(joinKeyRef);

      if (!joinKeySnapshot.exists()) {
        return { success: false, error: 'No project found for that key' };
      }

      const joinData = joinKeySnapshot.data();
      const projectId = joinData.projectId;
      const memberRef = doc(db, 'projects', projectId, 'members', user.uid);
      const existingMember = await getDoc(memberRef);

      if (existingMember.exists()) {
        const projectSnapshot = await getDoc(doc(db, 'projects', projectId));
        return {
          success: true,
          project: {
            id: projectId,
            ...projectSnapshot.data(),
            membership: existingMember.data()
          },
          alreadyMember: true
        };
      }

      const memberData = buildMemberProfile(user, userProfile, 'member');
      const batch = writeBatch(db);
      batch.set(doc(db, 'projects', projectId, 'member_secrets', user.uid), {
        userId: user.uid,
        projectId,
        joinKeyHash,
        createdAt: new Date()
      });
      batch.set(memberRef, {
        ...memberData,
        projectId,
        joinKeyHash
      });
      batch.set(doc(db, 'users', user.uid, 'projects', projectId), {
        projectId,
        role: 'member',
        name: joinData.projectName || 'Untitled project',
        joinedAt: new Date()
      });

      await batch.commit();

      const projectSnapshot = await getDoc(doc(db, 'projects', projectId));

      return {
        success: true,
        project: {
          id: projectId,
          ...projectSnapshot.data(),
          membership: memberData
        }
      };
    } catch (error) {
      console.error('Error joining project:', error);
      return { success: false, error };
    }
  }

  async updateMemberProfile(projectId, userId, profileData, options = {}) {
    try {
      const updates = {
        name: profileData.name,
        researchBackground: profileData.researchBackground || null,
        profileCompleted: !!profileData.profileCompleted,
        updatedAt: new Date()
      };

      if (profileData.reducedResearchBackground !== undefined) {
        updates.reducedResearchBackground = profileData.reducedResearchBackground || null;
      } else if (profileData.researchBackground && !options.skipResearchBackgroundSummary) {
        const summaryResult = await ResearchBackgroundSummaryService.generateSummary(
          profileData.researchBackground,
          profileData.name
        );

        if (summaryResult.success) {
          updates.reducedResearchBackground = summaryResult.keywords;
        } else {
          console.warn('Failed to generate project member research background:', summaryResult.error);
        }
      }

      if (profileData.initialDataView !== undefined) {
        const initialDataView = (profileData.initialDataView || '').trim();
        updates.initialDataView = initialDataView;
        updates.initialDataViewUpdatedAt = new Date();

        if (initialDataView) {
          updates.initialDataViewReminderDismissedAt = new Date();
        }
      }

      await updateDoc(doc(db, 'projects', projectId, 'members', userId), updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating project member profile:', error);
      return { success: false, error };
    }
  }

  async dismissInitialDataViewReminder(projectId, userId) {
    try {
      await updateDoc(doc(db, 'projects', projectId, 'members', userId), {
        initialDataViewReminderDismissedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error dismissing initial data view reminder:', error);
      return { success: false, error };
    }
  }

  async renameProject(projectId, userId, name) {
    try {
      const trimmedName = name.trim();
      const projectRef = doc(db, 'projects', projectId);
      const settingsRef = doc(projectRef, 'settings', 'invite');
      const settingsSnapshot = await getDoc(settingsRef);
      const joinKeyHash = settingsSnapshot.exists() ? settingsSnapshot.data().joinKeyHash : null;

      const batch = writeBatch(db);
      batch.update(projectRef, {
        name: trimmedName,
        updatedAt: new Date()
      });
      batch.update(doc(db, 'users', userId, 'projects', projectId), {
        name: trimmedName,
        updatedAt: new Date()
      });

      if (joinKeyHash) {
        batch.update(doc(db, 'project_join_keys', joinKeyHash), {
          projectName: trimmedName
        });
      }

      await batch.commit();

      return { success: true, project: { id: projectId, name: trimmedName } };
    } catch (error) {
      console.error('Error renaming project:', error);
      return { success: false, error };
    }
  }

  async regenerateJoinKey(projectId, userId) {
    try {
      const settingsRef = doc(db, 'projects', projectId, 'settings', 'invite');
      const settingsSnapshot = await getDoc(settingsRef);
      const previousHash = settingsSnapshot.exists() ? settingsSnapshot.data().joinKeyHash : null;
      const projectSnapshot = await getDoc(doc(db, 'projects', projectId));
      const projectName = projectSnapshot.exists() ? projectSnapshot.data().name : 'Untitled project';
      const joinKey = this.generateJoinKey();
      const joinKeyHash = await this.hashJoinKey(joinKey);

      const batch = writeBatch(db);
      if (previousHash) {
        batch.delete(doc(db, 'project_join_keys', previousHash));
      }
      batch.set(settingsRef, {
        joinKeyHash,
        joinKey,
        updatedBy: userId,
        updatedAt: new Date()
      });
      batch.set(doc(db, 'project_join_keys', joinKeyHash), {
        projectId,
        projectName,
        createdBy: userId,
        createdAt: new Date()
      });
      await batch.commit();

      return { success: true, joinKey };
    } catch (error) {
      console.error('Error regenerating project key:', error);
      return { success: false, error };
    }
  }

  async deleteCollectionDocuments(collectionRef) {
    const snapshot = await getDocs(collectionRef);
    return this.deleteDocumentRefs(snapshot.docs.map(documentSnapshot => documentSnapshot.ref));
  }

  async deleteDocumentRefs(documentRefs) {
    let batch = writeBatch(db);
    let operationCount = 0;

    for (const documentRef of documentRefs) {
      batch.delete(documentRef);
      operationCount += 1;

      if (operationCount === 450) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    return documentRefs.length;
  }

  async deleteCollectionGroup(projectId, collectionNames) {
    let deletedCount = 0;

    for (const collectionName of collectionNames) {
      deletedCount += await this.deleteCollectionDocuments(
        collection(db, 'projects', projectId, collectionName)
      );
    }

    return deletedCount;
  }

  async resetProjectData(projectId) {
    try {
      const deletedCount = await this.deleteCollectionGroup(projectId, PROJECT_DATA_COLLECTIONS);

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error resetting project:', error);
      return { success: false, error };
    }
  }

  async deleteProject(projectId, userId) {
    try {
      const projectRef = doc(db, 'projects', projectId);

      const settingsRef = doc(projectRef, 'settings', 'invite');
      const settingsSnapshot = await getDoc(settingsRef);
      const joinKeyHash = settingsSnapshot.exists() ? settingsSnapshot.data().joinKeyHash : null;

      const membersSnapshot = await getDocs(collection(projectRef, 'members'));
      const lastMemberDocs = userId
        ? membersSnapshot.docs.filter(memberDoc => memberDoc.id === userId)
        : membersSnapshot.docs.filter(memberDoc => memberDoc.data().role === 'owner');
      const lastMemberIds = new Set(lastMemberDocs.map(memberDoc => memberDoc.id));
      const otherMemberDocs = membersSnapshot.docs.filter(memberDoc => !lastMemberIds.has(memberDoc.id));

      await this.deleteCollectionGroup(projectId, PROJECT_DATA_COLLECTIONS);
      if (joinKeyHash) {
        const joinKeyRef = doc(db, 'project_join_keys', joinKeyHash);
        const joinKeySnapshot = await getDoc(joinKeyRef);
        if (joinKeySnapshot.exists()) {
          await deleteDoc(joinKeyRef);
        }
      }
      await this.deleteCollectionGroup(projectId, PROJECT_METADATA_COLLECTIONS);

      await this.deleteDocumentRefs(
        otherMemberDocs.map(memberDoc => doc(db, 'users', memberDoc.id, 'projects', projectId))
      );
      await this.deleteDocumentRefs(otherMemberDocs.map(memberDoc => memberDoc.ref));

      const finalBatch = writeBatch(db);
      finalBatch.delete(projectRef);
      lastMemberDocs.forEach(memberDoc => {
        finalBatch.delete(memberDoc.ref);
        finalBatch.delete(doc(db, 'users', memberDoc.id, 'projects', projectId));
      });
      await finalBatch.commit();

      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error };
    }
  }
}
