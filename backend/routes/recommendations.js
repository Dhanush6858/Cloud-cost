const express = require('express');
const router  = express.Router();
const { getRecommendations } = require('../engine/optimizer');

/**
 * GET /api/recommendations
 * Returns on-the-fly computed optimization recommendations.
 * Params: service, region
 */
router.get('/', async (req, res) => {
  try {
    const { service, region } = req.query;
    const recs = await getRecommendations({
      service: service || null,
      region:  region  || null,
    });
    res.json(recs);
  } catch (err) {
    console.error('GET /recommendations error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
