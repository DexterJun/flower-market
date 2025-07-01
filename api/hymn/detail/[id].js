const { getHymnDetailHandler } = require('../../../lib/handlers');
const { createVercelHandler } = require('../../../lib/vercel-adapter');

module.exports = createVercelHandler(getHymnDetailHandler); 