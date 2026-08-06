const mongoose = require('mongoose');

/**
 * Field-level encrypted journal (AES-256-GCM).
 * `plaintext` exists only for pre-migration legacy rows — never write new plaintext.
 */
const journalEntrySchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    ciphertext: { type: String, default: '' },
    iv: { type: String, default: '' },
    tag: { type: String, default: '' },
    encrypted: { type: Boolean, default: true },
    moodScore: { type: Number, min: 1, max: 5, default: null },
    /** Legacy only — cleared by encrypt-journals migration */
    plaintext: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
