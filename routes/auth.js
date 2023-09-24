const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/user");
const multer = require("multer");
const sharp = require("sharp");
const cloudinary = require('cloudinary').v2;

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the username is already taken
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    // If the username is not taken, hash the password and create a new user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred", error });
  }
});

// Upload
// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});
// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define your route for image uploads
router.post('/profileImage/:username', upload.single('image'), async (req, res) => {
    const { username } = req.params;
    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
     // Resize the image using sharp
     const resizedImage = await sharp(req.file.buffer)
     .resize(300, 300) // Change the dimensions as needed
     .toBuffer();
     // Upload the resized image to Cloudinary
     cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
       if (error) {
         console.error(error);
         return res.status(500).json({ error: 'Image upload failed' });
       }
   
       // Store the image information in MongoDB
       const imageUrl = result.secure_url;
       const publicId = result.public_id;
   
       // Update the user's profile image URL and public ID in the database
       user.profileImage = { imageUrl, publicId };
       await user.save();
   
       res.json({ imageUrl, publicId });
     }).end(resizedImage);

     res.status(201).json({ message: "OK" });
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    // Check if the user with the provided email exists
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Retrieve user details by username (excluding password)
router.get("/get-user/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Find the user by username and exclude the 'password' field
    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
