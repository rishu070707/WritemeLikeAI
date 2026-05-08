const cloudinary = require('cloudinary').v2;
const Generation = require('../models/Generation');
const HandwritingProfile = require('../models/HandwritingProfile');
const User = require('../models/User');
const axios = require('axios');

// @POST /api/generate
const generateHandwriting = async (req, res) => {
  let generation = null;
  try {
    const { text, profileId, settings, title } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Text is required.' });
    }

    // Check generation limits for free plan
    const user = await User.findById(req.user._id);
    if (user.plan === 'free' && user.generationsLeft <= 0) {
      return res.status(403).json({
        message: 'Generation limit reached. Upgrade to Pro.',
        upgradeRequired: true,
      });
    }

    // Fetch profile if provided
    let profile = null;
    if (profileId) {
      profile = await HandwritingProfile.findOne({
        _id: profileId,
        userId: req.user._id,
      });
    }

    // Create pending generation record
    generation = await Generation.create({
      userId: req.user._id,
      profileId: profileId || null,
      title: title || `Generation ${new Date().toLocaleDateString()}`,
      inputText: text,
      settings: settings || {},
      status: 'processing',
    });

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // Call AI service
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/generate`,
      {
        text,
        generationId: generation._id.toString(),
        profileId: profileId || null,
        modelId: profile?.modelId || null,
        styleMetrics: profile?.processedData || null,
        settings: {
          pageType: settings?.pageType || 'lined',
          fontSize: profile?.processedData?.avgSize ? Math.round(profile.processedData.avgSize * 12) : (settings?.fontSize || 24),
          inkColor: settings?.inkColor || '#1a1a2e',
          penType: settings?.penType || 'ballpoint',
          imperfectionLevel: settings?.imperfectionLevel ?? 0.5,
          slantAngle: profile?.processedData?.avgSlant || (settings?.slantAngle || 0),
          letterSpacing: profile?.processedData?.avgSpacing ? (profile.processedData.avgSpacing / 3.0) : (settings?.letterSpacing || 1),
          lineSpacing: settings?.lineSpacing || 1.5,
          marginLeft: settings?.marginLeft || 60,
          marginRight: settings?.marginRight || 40,
          marginTop: settings?.marginTop || 60,
        },
      },
      { timeout: 120000 }
    );

    const { pdfBase64, pngBase64Array, pageCount } = aiResponse.data;

    // Upload PDF to Cloudinary
    let pdfUrl = null;
    let pdfCloudinaryId = null;
    let thumbnailUrl = null;
    const pngUrls = [];

    if (pdfBase64) {
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      const pdfUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `writelikeme/outputs/${req.user._id}`,
            resource_type: 'raw',
            public_id: `gen_${generation._id}`,
          },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(pdfBuffer);
      });
      pdfUrl = pdfUpload.secure_url;
      pdfCloudinaryId = pdfUpload.public_id;
    }

    // Upload PNGs to Cloudinary in parallel
    if (pngBase64Array && pngBase64Array.length > 0) {
      const uploadPromises = pngBase64Array.map((base64, i) => {
        const pngBuffer = Buffer.from(base64, 'base64');
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: `writelikeme/pages/${req.user._id}` },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          stream.end(pngBuffer);
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      uploadResults.forEach((result, i) => {
        pngUrls.push(result.secure_url);
        if (i === 0) thumbnailUrl = result.secure_url;
      });
    }

    // Update generation record
    generation.status = 'completed';
    generation.output = { pdfUrl, pdfCloudinaryId, pngUrls, pageCount, thumbnailUrl };
    generation.processingTime = Date.now() - generation.createdAt.getTime();
    await generation.save();

    // Decrement free user generations
    if (user.plan === 'free') {
      user.generationsLeft = Math.max(0, user.generationsLeft - 1);
    }
    user.totalGenerations += 1;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      generation,
    });
  } catch (error) {
    console.error('Generation error:', error.message);
    if (generation) {
      generation.status = 'failed';
      generation.errorMessage = error.message;
      await generation.save().catch(console.error);
    }
    res.status(500).json({ message: 'Error generating handwriting.', error: error.message });
  }
};

// @GET /api/generate/history
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const [generations, total] = await Promise.all([
      Generation.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('profileId', 'name'),
      Generation.countDocuments({ userId: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      generations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history.' });
  }
};

// @GET /api/generate/:id
const getGeneration = async (req, res) => {
  try {
    const generation = await Generation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('profileId', 'name status');

    if (!generation) {
      return res.status(404).json({ message: 'Generation not found.' });
    }

    res.status(200).json({ success: true, generation });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching generation.' });
  }
};

// @DELETE /api/generate/:id
const deleteGeneration = async (req, res) => {
  try {
    const generation = await Generation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!generation) {
      return res.status(404).json({ message: 'Generation not found.' });
    }

    // Delete from Cloudinary
    if (generation.output.pdfCloudinaryId) {
      await cloudinary.uploader.destroy(generation.output.pdfCloudinaryId, {
        resource_type: 'raw',
      }).catch(console.error);
    }

    await generation.deleteOne();
    res.status(200).json({ success: true, message: 'Generation deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting generation.' });
  }
};

// @PATCH /api/generate/:id/favorite
const toggleFavorite = async (req, res) => {
  try {
    const generation = await Generation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!generation) {
      return res.status(404).json({ message: 'Generation not found.' });
    }

    generation.isFavorite = !generation.isFavorite;
    await generation.save();

    res.status(200).json({ success: true, isFavorite: generation.isFavorite });
  } catch (error) {
    res.status(500).json({ message: 'Error updating favorite.' });
  }
};

module.exports = { generateHandwriting, getHistory, getGeneration, deleteGeneration, toggleFavorite };
