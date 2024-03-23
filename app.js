import { fileURLToPath } from 'url';
import express from 'express';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('__dirname:', __dirname);

app.use(express.static(__dirname));

const serviceAccountKeyPath = path.join(__dirname, './serviceAccountKey.json');
const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  projectId: 'lost-found-78016',
  storageBucket: 'lost-found-78016.appspot.com'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Removed redundant firebaseConfig

const upload = multer();

// Route to handle image uploads
app.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    const imageFile = req.file;
    const imagePath = `images/${Date.now()}-${imageFile.originalname}`;
    const file = bucket.file(imagePath);

    // Upload the image to Firebase Storage
    const stream = file.createWriteStream({
      metadata: {
        contentType: imageFile.mimetype,
      },
    });

    stream.on('error', (error) => {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Error uploading image' });
    });

    stream.on('finish', async () => {
      await file.makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imagePath}`;
      const imageString = imageFile.buffer.toString('base64'); // Convert image to base64 string

      // Store the image URL and imageString in your Firestore database
      await storeImageInFirestore(imageUrl, imageString);
      res.json({ imageUrl });
    });

    stream.end(imageFile.buffer);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

// Function to store the image URL and imageString in Firestore
async function storeImageInFirestore(imageUrl, imageString) {
  try {
    const imagesRef = db.collection('Image');
    await imagesRef.add({
      imageUrl,
      imageString,
      uploadTime: new Date().toISOString(),
    });
    console.log('Image URL and imageString stored in Firestore');
  } catch (error) {
    console.error('Error storing image in Firestore:', error);
  }
}

// Fetch data from the "Images" collection
app.get('/images', async (req, res) => {
  try {
    const imagesCollection = await db.collection('Image').orderBy('uploadTime', 'desc').get();
    const images = imagesCollection.docs.map(doc => {
      const imageData = {
        id: doc.id,
        ...doc.data()
      };
      console.log('Image Data:', imageData); // Log image data
      return imageData;
    });
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'An error occurred while fetching images' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
