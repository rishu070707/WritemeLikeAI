const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateHandwriting,
  getHistory,
  getGeneration,
  deleteGeneration,
  toggleFavorite,
} = require('../controllers/generationController');

router.use(protect);

router.post('/', generateHandwriting);
router.get('/history', getHistory);
router.get('/:id', getGeneration);
router.delete('/:id', deleteGeneration);
router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
