const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

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
      
      // Get ALL users (not just inactive ones)
      const usersQuery = db.collectionGroup('users');
      const usersSnapshot = await usersQuery.get();
      
      if (usersSnapshot.empty) {
        console.log('No users found to clean up');
        return res.json({ success: true, result: { deletedCount: 0, totalDataDeleted: totalDeleted, message: 'No users found, but data cleared' } });
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
      console.log(`Complete cleanup finished - removed ${userIds.length} users and all associated data`);
      
      return res.json({ 
        success: true, 
        result: { 
          deletedCount: userIds.length, 
          highlightsDeleted: highlightsSnapshot.docs.length,
          message: 'Complete cleanup successful - all data removed' 
        } 
      });
    }
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
