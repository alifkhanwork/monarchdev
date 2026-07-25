/**
 * One-time migration: encrypt legacy plaintext JournalEntry rows in place.
 *
 * DO NOT run automatically. Backup first (see instructions below).
 *
 * Usage (from backend/):
 *   node scripts/encrypt-journals.js
 *   node scripts/encrypt-journals.js --dry-run
 *
 * Requires JOURNAL_ENCRYPTION_KEY and MONGO_URI in env (or backend/.env).
 */
require('dotenv').config();

const mongoose = require('mongoose');
const JournalEntry = require('../models/JournalEntry');
const {
  encryptJournalText,
  isEncryptedDoc,
  resolveJournalPlaintext,
  getJournalKey,
} = require('../utils/journalCrypto');

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required');
    process.exit(1);
  }

  try {
    getJournalKey();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(dryRun ? 'Dry run — no writes' : 'Connected — encrypting plaintext journals…');

  const docs = await JournalEntry.find({});
  let encrypted = 0;
  let already = 0;
  let empty = 0;
  let failed = 0;

  for (const doc of docs) {
    if (isEncryptedDoc(doc) && !doc.plaintext) {
      already += 1;
      continue;
    }

    let text = '';
    try {
      text = resolveJournalPlaintext(doc).trim();
    } catch (e) {
      console.error(`  FAIL ${doc.dateKey}: cannot read — ${e.message}`);
      failed += 1;
      continue;
    }

    if (!text) {
      empty += 1;
      if (!dryRun) {
        doc.plaintext = '';
        doc.ciphertext = '';
        doc.iv = '';
        doc.tag = '';
        doc.encrypted = true;
        await doc.save();
      }
      continue;
    }

    if (dryRun) {
      console.log(`  would encrypt ${doc.dateKey} (${text.length} chars)`);
      encrypted += 1;
      continue;
    }

    try {
      const payload = encryptJournalText(text);
      doc.ciphertext = payload.ciphertext;
      doc.iv = payload.iv;
      doc.tag = payload.tag;
      doc.encrypted = true;
      doc.plaintext = '';
      await doc.save();
      console.log(`  encrypted ${doc.dateKey}`);
      encrypted += 1;
    } catch (e) {
      console.error(`  FAIL ${doc.dateKey}: ${e.message}`);
      failed += 1;
    }
  }

  console.log('\nDone:', { encrypted, already, empty, failed, dryRun });
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
