const express = require('express');
const { getPlayer } = require('../utils/getPlayer');
const { calculateTotalPower } = require('../utils/totalPower');
const { getNextRank, RANK_LADDER } = require('../utils/ranks');
const { formatLifetimeStatsResponse, BADGE_DEFINITIONS } = require('../utils/lifetimeStats');
const { appendStatHistory, localDateKey } = require('../utils/statHistory');
const { saveWithRetry } = require('../utils/saveWithRetry');
const { deriveForPeriod } = require('../utils/dailyMetricLog');
const { normalizeStreaks } = require('../utils/gameLogic');

const router = express.Router();

const badgeIdToTitle = (badgeId) => {
  for (const list of Object.values(BADGE_DEFINITIONS)) {
    const found = list.find((b) => b.id === badgeId);
    if (found) {
      return found.name.startsWith('The ') ? found.name : `The ${found.name}`;
    }
  }
  return null;
};

const collectAvailableTitles = (user, level, totalPower) => {
  const titles = new Set(user.availableTitles || []);
  for (const id of user.unlockedBadges || []) {
    const t = badgeIdToTitle(id);
    if (t) titles.add(t);
  }
  for (const rank of RANK_LADDER) {
    if (level >= rank.level && totalPower >= rank.totalPower) {
      titles.add(rank.name);
    }
  }
  return [...titles];
};

const formatItem = (item) => {
  if (!item) return null;
  return {
    _id: item._id,
    name: item.name,
    type: item.type,
    rarity: item.rarity,
    statMultiplier: item.statMultiplier,
    unlockCondition: item.unlockCondition,
    imageUrl: item.imageUrl,
    description: item.description,
  };
};

const formatUserResponse = (user, weeklyProgress = null) => {
  const { totalPower, effectiveStats } = calculateTotalPower(
    user,
    user.equippedWeapon,
    user.equippedRelic
  );
  const availableTitles = collectAvailableTitles(user, user.level, totalPower);

  return {
    username: user.username,
    currentAge: user.currentAge ?? 20,
    level: user.level,
    currentExp: user.currentExp,
    expToNextLevel: user.expToNextLevel,
    stats: user.stats,
    effectiveStats,
    totalPower,
    statHistory: user.statHistory || [],
    streak: normalizeStreaks(user),
    nextRank: getNextRank(user.level, totalPower),
    rankLadder: RANK_LADDER,
    equippedTitle: user.equippedTitle,
    availableTitles,
    unlockedBadges: user.unlockedBadges || [],
    equippedWeapon: formatItem(user.equippedWeapon),
    equippedRelic: formatItem(user.equippedRelic),
    inventory: (user.inventory || []).map(formatItem).filter(Boolean),
    lifetimeStats: formatLifetimeStatsResponse(user),
    dayCompletionLog: user.dayCompletionLog || [],
    weeklyProgress: weeklyProgress || {
      workoutsCompleted: 0,
      workoutsTarget: 5,
      recoveryCompleted: 0,
      recoveryTarget: 2,
      splitLabel: 'UL × PPL',
    },
    spendableExp: user.spendableExp || 0,
    ownedShopItems: user.ownedShopItems || [],
    activeThemeAccent: user.activeThemeAccent || null,
    settings: {
      weightUnit: user.settings?.weightUnit === 'lbs' ? 'lbs' : 'kg',
      weekStartsOn: user.settings?.weekStartsOn === 0 ? 0 : 1,
      weeklyDigestEnabled: user.settings?.weeklyDigestEnabled !== false,
    },
    email: user.email || '',
    cheatDayTokens: user.cheatDayTokens || 0,
  };
};

// GET /api/user - Fetch player stats, loadout, and total power
router.get('/', async (req, res) => {
  try {
    let user = await getPlayer();
    const todayKey = localDateKey();
    const alreadyHasToday = (user.statHistory || []).some((e) => e.date === todayKey);
    appendStatHistory(user, new Date(), user.equippedWeapon, user.equippedRelic);

    const streakFixed = (user.currentStreak || 0) > (user.bestStreak || 0);
    normalizeStreaks(user);

    if (!alreadyHasToday || user.isModified('statHistory') || streakFixed) {
      try {
        user = await saveWithRetry(user);
      } catch (err) {
        if (err.name !== 'VersionError') throw err;
        user = await getPlayer();
        normalizeStreaks(user);
      }
    }

    const derived = await deriveForPeriod('weekly');
    const weeklyProgress = {
      workoutsCompleted: derived.workouts,
      workoutsTarget: 5,
      recoveryCompleted: derived.recoveryDays || 0,
      recoveryTarget: 2,
      splitLabel: 'UL × PPL',
    };

    res.json(formatUserResponse(user, weeklyProgress));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// PATCH /api/user/age - Update player's current age (Quest Board default filter)
router.patch('/age', async (req, res) => {
  try {
    const { currentAge } = req.body;
    const parsed = Number(currentAge);
    if (Number.isNaN(parsed) || parsed < 10 || parsed > 120) {
      return res.status(400).json({ message: 'Age must be between 10 and 120' });
    }

    const user = await getPlayer();
    user.currentAge = parsed;
    await user.save();

    res.json({ currentAge: user.currentAge });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update age', error: error.message });
  }
});

// PATCH /api/user/title - Update equipped title
router.patch('/title', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const user = await getPlayer();
    const { totalPower } = calculateTotalPower(user, user.equippedWeapon, user.equippedRelic);
    const allowed = collectAvailableTitles(user, user.level, totalPower);
    if (!allowed.includes(title)) {
      return res.status(400).json({ message: 'Title not available' });
    }

    if (!user.availableTitles.includes(title)) {
      user.availableTitles.push(title);
    }
    user.equippedTitle = title;
    await user.save();

    res.json({ equippedTitle: user.equippedTitle, availableTitles: collectAvailableTitles(user, user.level, totalPower) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update title', error: error.message });
  }
});

// PATCH /api/user/settings - Persist hunter preferences
router.patch('/settings', async (req, res) => {
  try {
    const user = await getPlayer();
    if (!user.settings) user.settings = {};

    const { weightUnit, weekStartsOn, weeklyDigestEnabled, email } = req.body || {};
    if (weightUnit !== undefined) {
      if (weightUnit !== 'kg' && weightUnit !== 'lbs') {
        return res.status(400).json({ message: 'weightUnit must be kg or lbs' });
      }
      user.settings.weightUnit = weightUnit;
    }
    if (weekStartsOn !== undefined) {
      const n = Number(weekStartsOn);
      if (n !== 0 && n !== 1) {
        return res.status(400).json({ message: 'weekStartsOn must be 0 (Sunday) or 1 (Monday)' });
      }
      user.settings.weekStartsOn = n;
    }
    if (weeklyDigestEnabled !== undefined) {
      user.settings.weeklyDigestEnabled = Boolean(weeklyDigestEnabled);
    }
    if (email !== undefined) {
      const trimmed = String(email).trim();
      if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
      user.email = trimmed;
    }

    user.markModified('settings');
    await saveWithRetry(user);

    res.json({
      email: user.email || '',
      settings: {
        weightUnit: user.settings.weightUnit === 'lbs' ? 'lbs' : 'kg',
        weekStartsOn: user.settings.weekStartsOn === 0 ? 0 : 1,
        weeklyDigestEnabled: user.settings.weeklyDigestEnabled !== false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
});

// PATCH /api/user/equip - Equip weapon or relic from inventory
router.patch('/equip', async (req, res) => {
  try {
    const { itemId, slot } = req.body;
    if (!itemId || !['weapon', 'relic'].includes(slot)) {
      return res.status(400).json({ message: 'itemId and slot (weapon|relic) are required' });
    }

    const user = await getPlayer();
    const ownsItem = user.inventory.some((id) => id.toString() === itemId);
    if (!ownsItem) {
      return res.status(400).json({ message: 'Item not in inventory' });
    }

    if (slot === 'weapon') {
      user.equippedWeapon = itemId;
    } else {
      user.equippedRelic = itemId;
    }

    await user.save();
    const updated = await getPlayer();
    res.json(formatUserResponse(updated));
  } catch (error) {
    res.status(500).json({ message: 'Failed to equip item', error: error.message });
  }
});

// POST /api/user/dismiss-penalty
router.post('/dismiss-penalty', async (req, res) => {
  try {
    const user = await getPlayer();
    if (user.pendingPenalty) {
      user.pendingPenalty.dismissed = true;
      await user.save();
    }
    res.json({ message: 'Penalty dismissed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to dismiss penalty', error: error.message });
  }
});

module.exports = router;
