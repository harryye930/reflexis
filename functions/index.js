const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Clean up highlights when a user is deleted
exports.cleanupUserHighlights = functions.auth.user().onDelete(async (user) => {
  const db = admin.firestore();
  
  try {
    // Delete all highlights created by this user across all app collections
    const highlightsQuery = db.collectionGroup('highlights')
      .where('userId', '==', user.uid);
    
    const snapshot = await highlightsQuery.get();
    
    if (snapshot.empty) {
      console.log(`No highlights found for user ${user.uid}`);
      return;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    console.log(`Deleted ${snapshot.docs.length} highlights for user ${user.uid}`);
    
  } catch (error) {
    console.error(`Error deleting highlights for user ${user.uid}:`, error);
  }
});

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
      
      // Delete ALL highlights first
      const highlightsQuery = db.collectionGroup('highlights');
      const highlightsSnapshot = await highlightsQuery.get();
      
      if (!highlightsSnapshot.empty) {
        const highlightsBatch = db.batch();
        highlightsSnapshot.docs.forEach(doc => {
          highlightsBatch.delete(doc.ref);
        });
        await highlightsBatch.commit();
        console.log(`Deleted ${highlightsSnapshot.docs.length} highlights`);
      }
      
      // Get ALL users (not just inactive ones)
      const usersQuery = db.collectionGroup('users');
      const usersSnapshot = await usersQuery.get();
      
      if (usersSnapshot.empty) {
        console.log('No users found to clean up');
        return res.json({ success: true, result: { deletedCount: 0, message: 'No users found, highlights cleared' } });
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
