const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    color: { type: String, default: '#3b82f6' }, // Hex color
    code: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
