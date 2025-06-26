const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Clean up inactive anonymous users every day at midnight
exports.cleanupInactiveUsers = functions.pubsub
  .schedule('0 0 * * *') // Daily at midnight UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = admin.firestore();
    const auth = admin.auth();
    
    // Delete user documents older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    try {
      // Query inactive anonymous users across all app collections
      const usersQuery = db.collectionGroup('users')
        .where('isAnonymous', '==', true)
        .where('lastSeen', '<', twentyFourHoursAgo);
      
      const snapshot = await usersQuery.get();
      
      if (snapshot.empty) {
        console.log('No inactive users to clean up');
        return { deletedCount: 0 };
      }
      
      const batch = db.batch();
      const userIds = [];
      
      // Batch delete user documents
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        userIds.push(doc.data().userId);
      });
      
      // Delete user documents
      await batch.commit();
      console.log(`Deleted ${userIds.length} user documents`);
      
      // Delete authentication records
      const deleteAuthPromises = userIds.map(uid => 
        auth.deleteUser(uid).catch(error => {
          console.warn(`Failed to delete auth user ${uid}:`, error.message);
        })
      );
      
      await Promise.all(deleteAuthPromises);
      console.log(`Cleaned up ${userIds.length} inactive anonymous users`);
      
      return { deletedCount: userIds.length };
      
    } catch (error) {
      console.error('Error cleaning up inactive users:', error);
      throw error;
    }
  });

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
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  try {
    const result = await exports.cleanupInactiveUsers.run();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
