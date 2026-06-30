const DailyTask = require('../models/DailyTask');

const VALID_CATEGORIES = ['Foundation', 'Health', 'Mental', 'Professional'];

/**
 * Legacy DBs may have category "Physical" from an older schema — map to Health.
 */
const migrateDailyTasks = async () => {
  const physicalFix = await DailyTask.updateMany(
    { category: 'Physical' },
    { $set: { category: 'Health' } }
  );

  const invalidFix = await DailyTask.updateMany(
    { category: { $nin: VALID_CATEGORIES } },
    { $set: { category: 'Health' } }
  );

  const total = (physicalFix.modifiedCount || 0) + (invalidFix.modifiedCount || 0);
  if (total > 0) {
    console.log(`🔧 Migrated ${total} daily task(s) to valid category`);
  }
};

module.exports = migrateDailyTasks;
