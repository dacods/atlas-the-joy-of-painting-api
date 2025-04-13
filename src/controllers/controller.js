const episodeService = require('../services/services');
const db = require('../db');

const episodeController = {
  getEpisodes: async (req, res) => {
    try {
      const filters = {
        month: req.query.month,
        subjects: req.query.subjects,
        colors: req.query.colors,
        match: req.query.match
      };

      const query = episodeService.getFilteredEpisodes(filters);
      const [rows] = await db.query(query.text, query.values);
      res.json(rows);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getEpisodeById: async (req, res) => {
    try {
        const episodeId = parseInt(req.params.id);
        
        if (isNaN(episodeId)) {
        return res.status(400).json({ error: 'Invalid episode ID' });
        }
        
        const query = await episodeService.getEpisodeById(episodeId);
        const [rows] = await db.query(query.text, query.values);
        
        if (rows.length === 0) {
        return res.status(404).json({ error: 'Episode not found' });
        }
        
        // Format the date to YYYY-MM-DD if it exists
        const episode = rows[0];
        if (episode.air_date) {
        episode.air_date = episode.air_date.toString().substring(0, 10);
        }
        
        res.json(episode);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    }
};

module.exports = episodeController;