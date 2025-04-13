const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/controller');

router.get('/', episodeController.getEpisodes);
router.get('/:id', episodeController.getEpisodeById);

module.exports = router;