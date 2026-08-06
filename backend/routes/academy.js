const express = require('express');
const Subject = require('../models/Subject');
const AcademyTask = require('../models/AcademyTask');

const router = express.Router();

// Preset default subjects if none exist
const DEFAULT_SUBJECTS = [
  { name: 'Calculus', color: '#3b82f6', code: 'MATH201' },
  { name: 'Data Structures', color: '#10b981', code: 'CS102' },
  { name: 'Systems Architecture', color: '#8b5cf6', code: 'CS301' },
  { name: 'Web Engineering', color: '#06b6d4', code: 'CS405' },
];

const ensureDefaultSubjects = async () => {
  const count = await Subject.countDocuments();
  if (count === 0) {
    await Subject.insertMany(DEFAULT_SUBJECTS);
  }
};

// GET /api/academy/subjects
router.get('/subjects', async (req, res) => {
  try {
    await ensureDefaultSubjects();
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subjects', error: error.message });
  }
});

// POST /api/academy/subjects
router.post('/subjects', async (req, res) => {
  try {
    const { name, color, code } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subject name is required' });
    }
    const existing = await Subject.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Subject with this name already exists' });
    }

    const subject = await Subject.create({
      name: name.trim(),
      color: color || '#3b82f6',
      code: code ? code.trim() : '',
    });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create subject', error: error.message });
  }
});

// PUT /api/academy/subjects/:id
router.put('/subjects/:id', async (req, res) => {
  try {
    const { name, color, code } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    if (name) subject.name = name.trim();
    if (color) subject.color = color;
    if (code !== undefined) subject.code = code.trim();

    await subject.save();
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update subject', error: error.message });
  }
});

// DELETE /api/academy/subjects/:id
router.delete('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Reassign or remove tasks for deleted subject
    await AcademyTask.deleteMany({ subject: req.params.id });
    res.json({ message: 'Subject and associated tasks deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete subject', error: error.message });
  }
});

// GET /api/academy/tasks
router.get('/tasks', async (req, res) => {
  try {
    await ensureDefaultSubjects();
    const { status, subjectId, upcoming, deadlines, days } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (subjectId) filter.subject = subjectId;

    let query = AcademyTask.find(filter).populate('subject').sort({ dueDate: 1, createdAt: -1 });

    if (deadlines === 'true' || upcoming === 'true') {
      const daysAhead = Number(days) || 3;
      const todayObj = new Date();
      const targetObj = new Date(todayObj);
      targetObj.setDate(todayObj.getDate() + daysAhead);

      const targetKey = targetObj.toISOString().slice(0, 10);
      filter.status = { $ne: 'Completed' };
      filter.dueDate = { $lte: targetKey };
      query = AcademyTask.find(filter).populate('subject').sort({ dueDate: 1 });
    }

    const tasks = await query;
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch academy tasks', error: error.message });
  }
});

// POST /api/academy/tasks
router.post('/tasks', async (req, res) => {
  try {
    const { title, subjectId, dueDate, status, notes } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }
    if (!subjectId) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }

    const task = await AcademyTask.create({
      title: title.trim(),
      subject: subjectId,
      dueDate,
      status: status || 'To Do',
      notes: notes ? notes.trim() : '',
    });

    const populated = await AcademyTask.findById(task._id).populate('subject');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create academy task', error: error.message });
  }
});

// PATCH /api/academy/tasks/:id
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { title, subjectId, dueDate, status, notes } = req.body;
    const task = await AcademyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (title !== undefined) task.title = title.trim();
    if (subjectId !== undefined) task.subject = subjectId;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (status !== undefined) task.status = status;
    if (notes !== undefined) task.notes = notes.trim();

    await task.save();
    const populated = await AcademyTask.findById(task._id).populate('subject');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update academy task', error: error.message });
  }
});

// DELETE /api/academy/tasks/:id
router.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await AcademyTask.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
});

module.exports = router;
