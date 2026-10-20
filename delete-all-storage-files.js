const admin = require('firebase-admin');

// Use your downloaded service account key file name here:
const serviceAccount = require('./nardahdev-firebase-adminsdk-fbsvc-80bcc7b123.json');

// Replace with your actual bucket name (e.g., 'nardahdev.appspot.com')
const bucketName = 'nardahdev.appspot.com';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketName,
});

const bucket = admin.storage().bucket();

async function deleteAllFilesInFolder(folder = '') {
  try {
    const [files] = await bucket.getFiles({ prefix: folder });
    if (files.length === 0) {
      console.log('No files found.');
      return;
    }
    await Promise.all(files.map(file => file.delete()));
    console.log(`Deleted ${files.length} files${folder ? ' in folder: ' + folder : ''}.`);
  } catch (err) {
    console.error('Error deleting files:', err);
  }
}

// To delete all files in the bucket, call with no argument:
deleteAllFilesInFolder();
