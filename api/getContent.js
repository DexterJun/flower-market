const { getContentHandler } = require('../lib/handlers');
const { createVercelHandler } = require('../lib/vercel-adapter');

module.exports = createVercelHandler(getContentHandler);

module.exports.config = {
  runtime: 'nodejs20.x',
  includeFiles: ['api/hymnData/hymnList.json']
};