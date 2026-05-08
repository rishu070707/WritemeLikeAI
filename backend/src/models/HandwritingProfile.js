const mongoose = require('mongoose');

const handwritingProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    default: 'My Handwriting',
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'failed'],
    default: 'pending',
  },
  uploadedSamples: [
    {
      fileUrl: String,
      cloudinaryId: String,
      originalName: String,
      fileType: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  processedData: {
    characterMap: { type: Map, of: [String] }, // char -> array of image URLs
    avgSlant: { type: Number, default: 0 },
    avgSize: { type: Number, default: 1 },
    avgSpacing: { type: Number, default: 1 },
    strokeStyle: { type: String, default: 'medium' },
    inkFlowVariance: { type: Number, default: 0.1 },
    baselineVariance: { type: Number, default: 2 },
    letterSpacingVariance: { type: Number, default: 1 },
    wordSpacingVariance: { type: Number, default: 2 },
  },
  modelId: {
    type: String,
    default: null,
  },
  trainingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  sampleCount: {
    type: Number,
    default: 0,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

handwritingProfileSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('HandwritingProfile', handwritingProfileSchema);
