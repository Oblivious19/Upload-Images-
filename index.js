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
      // Include the uploadTime field with the current timestamp
      await storeImageInFirestore(imageUrl, imageString, new Date().toISOString());
      res.json({ imageUrl });
    });

    stream.end(imageFile.buffer);
 } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error uploading image' });
 }
});