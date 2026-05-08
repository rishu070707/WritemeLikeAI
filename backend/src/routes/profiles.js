const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  getProfiles,
  createProfile,
  uploadSamples,
  trainProfile,
  getTrainingStatus,
  deleteProfile,
} = require('../controllers/profileController');

// Store in memory for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'), false);
    }
  },
});

router.use(protect);

router.get('/', getProfiles);
router.post('/', createProfile);
router.post('/:id/upload', upload.array('files', 10), uploadSamples);
router.post('/:id/train', trainProfile);
router.get('/:id/status', getTrainingStatus);
router.delete('/:id', deleteProfile);

module.exports = router;
