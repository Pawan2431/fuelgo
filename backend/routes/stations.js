const express = require('express');
const db = require('../database');

const router = express.Router();

// Get all stations (with optional filters)
router.get('/', (req, res) => {
  const { city, fuel } = req.query;

  try {
    let query = 'SELECT * FROM stations WHERE is_open = 1';
    const params = [];

    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }

    let stations = db.prepare(query).all(...params);

    // SQLite doesn't natively query JSON arrays easily, so we filter in JS
    if (fuel) {
      stations = stations.filter(station => {
        try {
          const fuels = JSON.parse(station.fuels_available);
          return fuels.includes(fuel.toLowerCase());
        } catch (e) {
          return false;
        }
      });
    }

    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching stations.' });
  }
});

// Get a single station
router.get('/:id', (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found.' });
    }
    res.json(station);
  } catch (error) {
    res.status(500).json({ error: 'Database error while fetching station.' });
  }
});

module.exports = router;
