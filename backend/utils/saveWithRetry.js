/**
 * Save a Mongoose document, retrying on VersionError (optimistic concurrency clash).
 * Common when GET /api/user and GET /api/dailies both save the single player doc in parallel.
 */
const saveWithRetry = async (doc, { maxRetries = 3 } = {}) => {
  let current = doc;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await current.save();
      return current;
    } catch (err) {
      lastError = err;
      if (err.name !== 'VersionError' || attempt === maxRetries - 1) {
        throw err;
      }

      const fresh = await current.constructor.findById(current._id);
      if (!fresh) throw err;

      for (const path of current.modifiedPaths()) {
        if (path === '__v') continue;
        fresh.set(path, current.get(path));
      }
      current = fresh;
    }
  }

  throw lastError;
};

module.exports = { saveWithRetry };
