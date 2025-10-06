const { getTopicDetailHandler } = require('../../lib/handlers');
const { createVercelHandler } = require('../../lib/vercel-adapter');

module.exports = createVercelHandler(getTopicDetailHandler);

module.exports.config = {
  runtime: 'nodejs20.x',
  includeFiles: ['api/meetingData/*.json']
};


