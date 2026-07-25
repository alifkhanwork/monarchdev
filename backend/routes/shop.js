const express = require('express');
const { getPlayer } = require('../utils/getPlayer');
const { SHOP_ITEMS } = require('../utils/shopCatalog');
const { saveWithRetry } = require('../utils/saveWithRetry');

const router = express.Router();

const formatShop = (user) => {
  const owned = new Set(user.ownedShopItems || []);
  return {
    spendableExp: user.spendableExp || 0,
    cheatDayTokens: user.cheatDayTokens || 0,
    activeThemeAccent: user.activeThemeAccent || null,
    items: SHOP_ITEMS.map((item) => ({
      ...item,
      owned: item.stackable ? false : owned.has(item.id),
      canAfford: (user.spendableExp || 0) >= item.cost,
    })),
  };
};

router.get('/', async (_req, res) => {
  try {
    const user = await getPlayer();
    res.json(formatShop(user));
  } catch (error) {
    res.status(500).json({ message: 'Failed to load shop', error: error.message });
  }
});

router.post('/purchase', async (req, res) => {
  try {
    const { itemId } = req.body || {};
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const user = await getPlayer();
    user.ownedShopItems = user.ownedShopItems || [];
    user.spendableExp = user.spendableExp || 0;

    if (!item.stackable && user.ownedShopItems.includes(item.id)) {
      return res.status(400).json({ message: 'Already owned' });
    }
    if (user.spendableExp < item.cost) {
      return res.status(400).json({ message: 'Not enough spendable EXP' });
    }

    user.spendableExp -= item.cost;

    if (item.type === 'title') {
      if (!user.ownedShopItems.includes(item.id)) user.ownedShopItems.push(item.id);
      if (!user.availableTitles.includes(item.payload)) {
        user.availableTitles.push(item.payload);
      }
    } else if (item.type === 'theme') {
      if (!user.ownedShopItems.includes(item.id)) user.ownedShopItems.push(item.id);
      user.activeThemeAccent = item.payload;
    } else if (item.type === 'token') {
      user.cheatDayTokens = (user.cheatDayTokens || 0) + 1;
    }

    await saveWithRetry(user);
    res.json({
      message: `Purchased ${item.name}`,
      shop: formatShop(user),
      equippedTitle: user.equippedTitle,
      availableTitles: user.availableTitles,
    });
  } catch (error) {
    res.status(500).json({ message: 'Purchase failed', error: error.message });
  }
});

router.post('/equip-theme', async (req, res) => {
  try {
    const { accent } = req.body || {};
    const user = await getPlayer();
    const owned = user.ownedShopItems || [];
    const match = SHOP_ITEMS.find((i) => i.type === 'theme' && i.payload === accent);
    if (accent && match && !owned.includes(match.id)) {
      return res.status(400).json({ message: 'Theme not owned' });
    }
    user.activeThemeAccent = accent || null;
    await saveWithRetry(user);
    res.json({ activeThemeAccent: user.activeThemeAccent });
  } catch (error) {
    res.status(500).json({ message: 'Failed to equip theme', error: error.message });
  }
});

module.exports = router;
