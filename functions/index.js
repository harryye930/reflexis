const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const disabledPrototypeEndpoint = (name) => functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  res.status(410).json({
    success: false,
    error: `${name} has been disabled. Project setup and reset are now scoped by Firestore project membership rules.`
  });
});

exports.initializeCodes = disabledPrototypeEndpoint('initializeCodes');
exports.manualCleanup = disabledPrototypeEndpoint('manualCleanup');
