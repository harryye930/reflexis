const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Default codes configuration
const DEFAULT_CODES = [
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

// Helper function to initialize default codes
async function initializeDefaultCodes(db) {
  try {
    const codesBatch = db.batch();
    const historyBatch = db.batch();
    let addedCount = 0;
    
    for (const code of DEFAULT_CODES) {
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
      
      // Add history entry for code creation
      const historyRef = db.collection('artifacts/scholarmate-collab/public/data/code_history').doc();
      historyBatch.set(historyRef, {
        codeId: code.id,
        type: 'created',
        userId: 'system',
        user: 'system',
        description: `Code "${code.label}" created as part of default set`,
        changes: {
          label: code.label,
          description: code.description,
          color: code.color
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      addedCount++;
    }
    
    await codesBatch.commit();
    await historyBatch.commit();
    console.log(`Successfully initialized ${addedCount} default codes with history tracking`);
    return addedCount;
  } catch (error) {
    console.error('Error initializing default codes:', error);
    throw error;
  }
}

// Separate function to initialize codes (can be called independently)
exports.initializeCodes = functions.https.onRequest(async (req, res) => {
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
    
    // Optional: Check if codes already exist
    const existingCodesSnapshot = await db.collection('artifacts/scholarmate-collab/public/data/codes').get();
    if (!existingCodesSnapshot.empty) {
      return res.json({ 
        success: true, 
        message: 'Codes already exist', 
        existingCount: existingCodesSnapshot.docs.length 
      });
    }
    
    const codesAdded = await initializeDefaultCodes(db);
    
    return res.json({ 
      success: true, 
      message: 'Default codes initialized successfully',
      codesAdded: codesAdded
    });
  } catch (error) {
    console.error('Initialize codes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual cleanup function
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
    const reinitializeCodes = requestBody.reinitializeCodes !== false; // Default to true
    
    if (completeCleanup) {
      console.log('Starting complete cleanup - removing ALL users and data');
      
      let totalDeleted = 0;
      const cleanupResults = {};

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
        cleanupResults.highlightsDeleted = highlightsSnapshot.docs.length;
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
        cleanupResults.reflexiveDeleted = reflexiveSnapshot.docs.length;
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
        cleanupResults.codesDeleted = codesSnapshot.docs.length;
        console.log(`Deleted ${codesSnapshot.docs.length} codes`);
      }

      // Delete ALL code history
      const codeHistoryQuery = db.collection('artifacts/scholarmate-collab/public/data/code_history');
      const codeHistorySnapshot = await codeHistoryQuery.get();
      
      if (!codeHistorySnapshot.empty) {
        const codeHistoryBatch = db.batch();
        codeHistorySnapshot.docs.forEach(doc => {
          codeHistoryBatch.delete(doc.ref);
        });
        await codeHistoryBatch.commit();
        totalDeleted += codeHistorySnapshot.docs.length;
        cleanupResults.codeHistoryDeleted = codeHistorySnapshot.docs.length;
        console.log(`Deleted ${codeHistorySnapshot.docs.length} code history entries`);
      }
      
      // Get ALL users (not just inactive ones)
      const usersQuery = db.collectionGroup('users');
      const usersSnapshot = await usersQuery.get();
      
      let userIds = [];
      if (!usersSnapshot.empty) {
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
      }
      
      cleanupResults.usersDeleted = userIds.length;
      cleanupResults.totalDeleted = totalDeleted;
      
      // Reinitialize codes if requested (default behavior)
      if (reinitializeCodes) {
        try {
          const codesAdded = await initializeDefaultCodes(db);
          cleanupResults.defaultCodesAdded = codesAdded;
          console.log(`Complete cleanup finished - removed ${userIds.length} users and all associated data, added ${codesAdded} default codes`);
        } catch (error) {
          console.error('Failed to initialize default codes after cleanup:', error);
          cleanupResults.codesInitError = error.message;
        }
      } else {
        console.log(`Complete cleanup finished - removed ${userIds.length} users and all associated data (codes not reinitialized)`);
      }
      
      return res.json({ 
        success: true, 
        result: cleanupResults,
        message: reinitializeCodes 
          ? 'Complete cleanup successful - all data removed and default codes initialized' 
          : 'Complete cleanup successful - all data removed'
      });
    } else {
      return res.json({ 
        success: false, 
        message: 'completeCleanup parameter must be set to true' 
      });
    }
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
