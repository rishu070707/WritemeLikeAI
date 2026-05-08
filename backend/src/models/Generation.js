const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HandwritingProfile',
    default: null,
  },
  title: {
    type: String,
    default: 'Untitled Generation',
    trim: true,
  },
  inputText: {
    type: String,
    required: true,
    maxlength: [50000, 'Text cannot exceed 50000 characters'],
  },
  settings: {
    pageType: {
      type: String,
      enum: ['blank', 'lined', 'double-lined', 'ruled', 'grid'],
      default: 'lined',
    },
    fontSize: { type: Number, default: 24, min: 12, max: 60 },
    inkColor: { type: String, default: '#1a1a2e' },
    penType: {
      type: String,
      enum: ['ballpoint', 'fountain', 'gel', 'pencil', 'marker'],
      default: 'ballpoint',
    },
    imperfectionLevel: { type: Number, default: 0.5, min: 0, max: 1 },
    slantAngle: { type: Number, default: 0, min: -30, max: 30 },
    letterSpacing: { type: Number, default: 1, min: 0.5, max: 3 },
    lineSpacing: { type: Number, default: 1.5, min: 1, max: 3 },
    marginLeft: { type: Number, default: 60 },
    marginRight: { type: Number, default: 40 },
    marginTop: { type: Number, default: 60 },
    pageWidth: { type: Number, default: 794 },
    pageHeight: { type: Number, default: 1123 },
    customTemplate: { type: String, default: null },
  },
  output: {
    pdfUrl: { type: String, default: null },
    pdfCloudinaryId: { type: String, default: null },
    pngUrls: [String],
    pageCount: { type: Number, default: 0 },
    thumbnailUrl: { type: String, default: null },
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  errorMessage: { type: String, default: null },
  processingTime: { type: Number, default: null }, // ms
  isFavorite: { type: Boolean, default: false },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

generationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

generationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Generation', generationSchema);
