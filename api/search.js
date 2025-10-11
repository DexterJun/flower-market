const { searchImagesHandler } = require('../lib/handlers');
const { createVercelHandler } = require('../lib/vercel-adapter');

module.exports = createVercelHandler(searchImagesHandler);

module.exports.config = {
  runtime: 'nodejs20.x',
  includeFiles: ['api/hymnData/hymnList.json']
}; 