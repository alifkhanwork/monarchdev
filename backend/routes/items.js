const express = require('express');
const Item = require('../models/Item');

const router = express.Router();

// GET /api/items - List all gear definitions
router.get('/', async (req, res) => {
  try {
    const { type, rarity } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (rarity) filter.rarity = rarity;

    const items = await Item.find(filter).sort({ rarity: -1, name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch items', error: error.message });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch item', error: error.message });
  }
});

module.exports = router;
