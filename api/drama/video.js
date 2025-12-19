const { getDramaVideoHandler } = require('../../lib/handlers');
const { createVercelHandler } = require('../../lib/vercel-adapter');

module.exports = createVercelHandler(getDramaVideoHandler);

module.exports.config = {
  runtime: 'nodejs20.x',
};

