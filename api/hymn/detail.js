const { getHymnDetailHandler } = require('../../lib/handlers');
const { createVercelHandler } = require('../../lib/vercel-adapter');

module.exports = createVercelHandler(getHymnDetailHandler);

module.exports.config = {
  runtime: 'nodejs20.x',
  includeFiles: ['api/hymnData/hymnDetail.json']
};

