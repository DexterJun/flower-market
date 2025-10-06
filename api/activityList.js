const { getActivityListHandler } = require('../lib/handlers');
const { createVercelHandler } = require('../lib/vercel-adapter');

module.exports = createVercelHandler(getActivityListHandler);

module.exports.config = {
  runtime: 'nodejs20.x',
  includeFiles: ['api/activityData/*.json']
};


