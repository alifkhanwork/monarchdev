const express = require('express');
const { getPlayer } = require('../utils/getPlayer');
const { sendWeeklyDigest } = require('../utils/weeklyDigest');

const router = express.Router();

function assertCronAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    const err = new Error('CRON_SECRET is not configured');
    err.statusCode = 503;
    throw err;
  }
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const alt = req.headers['x-cron-secret'];
  if (bearer !== secret && alt !== secret) {
    const err = new Error('Unauthorized cron request');
    err.statusCode = 401;
    throw err;
  }
}

/** Vercel Cron → GET /api/cron/weekly-digest (Sunday evening Manila ≈ 12:00 UTC). */
router.get('/weekly-digest', async (req, res) => {
  try {
    assertCronAuthorized(req);
    const user = await getPlayer();
    const result = await sendWeeklyDigest(user);
    res.json({
      ok: true,
      ...result,
      at: new Date().toISOString(),
    });
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ ok: false, message: error.message });
  }
});

module.exports = router;
