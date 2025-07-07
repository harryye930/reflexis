const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Move default codes initialization to a separate function
async function initDefaultCodes(db, admin) {
  const defaultCodes = [
    { 
      id: 'key_insight', 
      label: 'Key Insight', 
      description: 'Mark important discoveries or realizations from the text',
      color: 'bg-blue-200', 
      textColor: 'text-blue-800' 
    },
    { 
      id: 'question', 
      label: 'Question', 
      description: 'Highlight areas that raise questions or need clarification',
      color: 'bg-yellow-200', 
      textColor: 'text-yellow-800' 
    },
    { 
      id: 'agreement', 
      label: 'Agreement', 
      description: 'Mark text you agree with or that supports your views',
      color: 'bg-green-200', 
      textColor: 'text-green-800' 
    },
    { 
      id: 'disagreement', 
      label: 'Disagreement', 
      description: 'Highlight text you disagree with or find problematic',
      color: 'bg-red-200', 
      textColor: 'text-red-800' 
    },
    { 
      id: 'important_quote', 
      label: 'Important Quote', 
      description: 'Mark significant quotes worth referencing later',
      color: 'bg-purple-200', 
      textColor: 'text-purple-800' 
    }
  ];

  const codesBatch = db.batch();
  defaultCodes.forEach(code => {
    const codeRef = db.doc(`artifacts/scholarmate-collab/public/data/codes/${code.id}`);
    codesBatch.set(codeRef, {
      id: code.id,
      label: code.label,
      description: code.description,
      color: code.color,
      textColor: code.textColor,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    });
  });
  await codesBatch.commit();
  return defaultCodes.length;
}

// Manual cleanup function that can be called via HTTP
exports.manualCleanup = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  try {
    const db = admin.firestore();
    const auth = admin.auth();
    const requestBody = req.body || {};
    const completeCleanup = requestBody.completeCleanup || false;
    
    if (completeCleanup) {
      console.log('Starting complete cleanup - removing ALL users and data');
      
      let totalDeleted = 0;

      // Delete ALL highlights first
      const highlightsQuery = db.collectionGroup('highlights');
      const highlightsSnapshot = await highlightsQuery.get();
      
      if (!highlightsSnapshot.empty) {
        const highlightsBatch = db.batch();
        highlightsSnapshot.docs.forEach(doc => {
          highlightsBatch.delete(doc.ref);
        });
        await highlightsBatch.commit();
        totalDeleted += highlightsSnapshot.docs.length;
        console.log(`Deleted ${highlightsSnapshot.docs.length} highlights`);
      }

      // Delete ALL reflexive responses
      const reflexiveQuery = db.collectionGroup('reflexive_responses');
      const reflexiveSnapshot = await reflexiveQuery.get();
      
      if (!reflexiveSnapshot.empty) {
        const reflexiveBatch = db.batch();
        reflexiveSnapshot.docs.forEach(doc => {
          reflexiveBatch.delete(doc.ref);
        });
        await reflexiveBatch.commit();
        totalDeleted += reflexiveSnapshot.docs.length;
        console.log(`Deleted ${reflexiveSnapshot.docs.length} reflexive responses`);
      }

      // Delete ALL codes
      const codesQuery = db.collection('artifacts/scholarmate-collab/public/data/codes');
      const codesSnapshot = await codesQuery.get();
      
      if (!codesSnapshot.empty) {
        const codesBatch = db.batch();
        codesSnapshot.docs.forEach(doc => {
          codesBatch.delete(doc.ref);
        });
        await codesBatch.commit();
        totalDeleted += codesSnapshot.docs.length;
        console.log(`Deleted ${codesSnapshot.docs.length} codes`);
      }
      
      // Get ALL users (not just inactive ones)
      const usersQuery = db.collectionGroup('users');
      const usersSnapshot = await usersQuery.get();
      
      if (usersSnapshot.empty) {
        console.log('No users found to clean up');
        // Still initialize default codes
        const defaultCodesAdded = await initDefaultCodes(db, admin);
        return res.json({ success: true, result: { deletedCount: 0, totalDataDeleted: totalDeleted, defaultCodesAdded, message: 'No users found, but data cleared and default codes initialized' } });
      }
      
      const userIds = [];
      const usersBatch = db.batch();
      
      // Batch delete all user documents
      usersSnapshot.docs.forEach(doc => {
        usersBatch.delete(doc.ref);
        const userData = doc.data();
        if (userData.userId) {
          userIds.push(userData.userId);
        }
      });
      
      // Delete all user documents
      await usersBatch.commit();
      console.log(`Deleted ${userIds.length} user documents`);
      
      // Delete all authentication records
      const deleteAuthPromises = userIds.map(uid => 
        auth.deleteUser(uid).catch(error => {
          console.warn(`Failed to delete auth user ${uid}:`, error.message);
        })
      );
      
      await Promise.all(deleteAuthPromises);
      
      // Initialize default codes after cleanup
      const defaultCodesAdded = await initDefaultCodes(db, admin);
      
      console.log(`Complete cleanup finished - removed ${userIds.length} users and all associated data, added default codes`);
      
      return res.json({ 
        success: true, 
        result: { 
          deletedCount: userIds.length, 
          highlightsDeleted: highlightsSnapshot.docs.length,
          reflexiveDeleted: reflexiveSnapshot.docs.length,
          codesDeleted: codesSnapshot.docs.length,
          defaultCodesAdded,
          message: 'Complete cleanup successful - all data removed and default codes initialized' 
        } 
      });
    }
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
