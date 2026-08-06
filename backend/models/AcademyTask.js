const mongoose = require('mongoose');

const academyTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    dueDate: { type: String, required: true }, // YYYY-MM-DD
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Completed'],
      default: 'To Do',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademyTask', academyTaskSchema);
