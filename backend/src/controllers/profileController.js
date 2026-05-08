const cloudinary = require('cloudinary').v2;
const HandwritingProfile = require('../models/HandwritingProfile');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @GET /api/profiles
const getProfiles = async (req, res) => {
  try {
    const profiles = await HandwritingProfile.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, profiles });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profiles.' });
  }
};

// @POST /api/profiles
const createProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const profile = await HandwritingProfile.create({
      userId: req.user._id,
      name: name || 'My Handwriting',
    });
    res.status(201).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ message: 'Error creating profile.' });
  }
};

// @POST /api/profiles/:id/upload
const uploadSamples = async (req, res) => {
  try {
    const profile = await HandwritingProfile.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const uploadedSamples = [];

    for (const file of req.files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        continue; // Skip invalid files
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `writelikeme/samples/${req.user._id}`,
            resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      uploadedSamples.push({
        fileUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        originalName: file.originalname,
        fileType: file.mimetype,
      });
    }

    profile.uploadedSamples.push(...uploadedSamples);
    profile.sampleCount = profile.uploadedSamples.length;
    profile.status = 'pending';
    await profile.save();

    res.status(200).json({
      success: true,
      profile,
      uploadedCount: uploadedSamples.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading files.' });
  }
};

// @POST /api/profiles/:id/train
const trainProfile = async (req, res) => {
  try {
    const profile = await HandwritingProfile.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    if (profile.uploadedSamples.length === 0) {
      return res.status(400).json({ message: 'Please upload handwriting samples first.' });
    }

    profile.status = 'processing';
    profile.trainingProgress = 0;
    await profile.save();

    // Send to AI service for processing
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // Fire and forget - training happens async
    axios
      .post(`${AI_SERVICE_URL}/api/train`, {
        profileId: profile._id.toString(),
        userId: req.user._id.toString(),
        sampleUrls: profile.uploadedSamples.map((s) => s.fileUrl),
      })
      .then(async (response) => {
        profile.status = 'ready';
        profile.trainingProgress = 100;
        profile.modelId = response.data.modelId;
        if (response.data.styleMetrics) {
          Object.assign(profile.processedData, response.data.styleMetrics);
        }
        await profile.save();
      })
      .catch(async (err) => {
        console.error('Training failed:', err.message);
        profile.status = 'failed';
        profile.errorMessage = err.message;
        await profile.save();
      });

    res.status(200).json({
      success: true,
      message: 'Training started. This may take a few minutes.',
      profile,
    });
  } catch (error) {
    console.error('Train error:', error);
    res.status(500).json({ message: 'Error starting training.' });
  }
};

// @GET /api/profiles/:id/status
const getTrainingStatus = async (req, res) => {
  try {
    const profile = await HandwritingProfile.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    res.status(200).json({
      success: true,
      status: profile.status,
      progress: profile.trainingProgress,
      modelId: profile.modelId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking status.' });
  }
};

// @DELETE /api/profiles/:id
const deleteProfile = async (req, res) => {
  try {
    const profile = await HandwritingProfile.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Delete samples from Cloudinary
    for (const sample of profile.uploadedSamples) {
      if (sample.cloudinaryId) {
        await cloudinary.uploader.destroy(sample.cloudinaryId).catch(console.error);
      }
    }

    await profile.deleteOne();
    res.status(200).json({ success: true, message: 'Profile deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting profile.' });
  }
};

module.exports = { getProfiles, createProfile, uploadSamples, trainProfile, getTrainingStatus, deleteProfile };
