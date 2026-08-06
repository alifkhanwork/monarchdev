const express = require('express');
const JournalEntry = require('../models/JournalEntry');
const {
  encryptJournalText,
  resolveJournalPlaintext,
  isEncryptedDoc,
} = require('../utils/journalCrypto');
const {
  validateDateKey,
  validateJournalText,
  LIMITS,
} = require('../utils/validateInput');

const router = express.Router();

function toPublicEntry(doc) {
  const text = resolveJournalPlaintext(doc);
  return {
    dateKey: doc.dateKey,
    text,
    moodScore: doc.moodScore ?? null,
    updatedAt: doc.updatedAt,
    encrypted: isEncryptedDoc(doc),
  };
}

/** GET /api/journals?limit=20&before=YYYY-MM-DD&month=YYYY-MM */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const filter = {};

    if (req.query.month) {
      const month = String(req.query.month).trim();
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: 'month must be YYYY-MM' });
      }
      filter.dateKey = { $gte: `${month}-01`, $lte: `${month}-31` };
    }

    if (req.query.before) {
      const before = validateDateKey(req.query.before);
      filter.dateKey = filter.dateKey
        ? { ...filter.dateKey, $lt: before }
        : { $lt: before };
    }

    const docs = await JournalEntry.find(filter)
      .sort({ dateKey: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const slice = hasMore ? docs.slice(0, limit) : docs;
    const entries = slice.map(toPublicEntry).filter((e) => e.text.trim().length > 0);

    res.json({
      entries,
      hasMore,
      nextBefore: hasMore && slice.length ? slice[slice.length - 1].dateKey : null,
      limit,
    });
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message || 'Failed to list journals' });
  }
});

/** GET /api/journals/months — distinct YYYY-MM for jump navigation (no decrypt). */
router.get('/months', async (req, res) => {
  try {
    const keys = await JournalEntry.distinct('dateKey');
    const months = [
      ...new Set(
        keys
          .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
          .map((k) => k.slice(0, 7))
      ),
    ].sort((a, b) => b.localeCompare(a));
    res.json({ months });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to list months' });
  }
});

/**
 * POST /api/journals/sync-local
 * One-time / idempotent upload of browser localStorage journals.
 * Body: { entries: { [dateKey]: text } }
 * Skips keys that already have an encrypted server entry.
 */
router.post('/sync-local', async (req, res) => {
  try {
    const entries = req.body?.entries;
    if (!entries || typeof entries !== 'object') {
      return res.status(400).json({ message: 'entries object is required' });
    }

    let imported = 0;
    let skipped = 0;
    let invalid = 0;

    for (const [rawKey, rawText] of Object.entries(entries)) {
      let dateKey;
      let text;
      try {
        dateKey = validateDateKey(rawKey);
        text = validateJournalText(rawText);
      } catch {
        invalid += 1;
        continue;
      }

      const existing = await JournalEntry.findOne({ dateKey });
      if (existing && isEncryptedDoc(existing)) {
        skipped += 1;
        continue;
      }
      if (existing && resolveJournalPlaintext(existing).trim().length >= LIMITS.journalMinChars) {
        skipped += 1;
        continue;
      }

      const { ciphertext, iv, tag } = encryptJournalText(text);
      await JournalEntry.findOneAndUpdate(
        { dateKey },
        {
          $set: {
            ciphertext,
            iv,
            tag,
            encrypted: true,
            plaintext: '',
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      imported += 1;
    }

    res.json({ imported, skipped, invalid });
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message || 'Failed to sync journals' });
  }
});

/** GET /api/journals/:dateKey */
router.get('/:dateKey', async (req, res) => {
  try {
    const dateKey = validateDateKey(req.params.dateKey);
    const doc = await JournalEntry.findOne({ dateKey }).lean();
    if (!doc) {
      return res.json({ dateKey, text: '', updatedAt: null, encrypted: false });
    }
    res.json(toPublicEntry(doc));
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message || 'Failed to load journal' });
  }
});

/** PUT /api/journals/:dateKey — upsert encrypted entry */
router.put('/:dateKey', async (req, res) => {
  try {
    const dateKey = validateDateKey(req.params.dateKey);
    const text = validateJournalText(req.body?.text);

    const moodScore = req.body?.moodScore != null ? Number(req.body.moodScore) : null;
    const { ciphertext, iv, tag } = encryptJournalText(text);
    const updatePayload = {
      ciphertext,
      iv,
      tag,
      encrypted: true,
      plaintext: '',
    };
    if (moodScore != null && moodScore >= 1 && moodScore <= 5) {
      updatePayload.moodScore = moodScore;
    }

    const doc = await JournalEntry.findOneAndUpdate(
      { dateKey },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(toPublicEntry(doc));
  } catch (error) {
    const code = error.statusCode || 500;
    res.status(code).json({ message: error.message || 'Failed to save journal' });
  }
});

module.exports = router;
