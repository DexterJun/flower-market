const { addHymnHandler } = require('../../lib/handlers');
const { createVercelHandler } = require('../../lib/vercel-adapter');

module.exports = createVercelHandler(addHymnHandler); 