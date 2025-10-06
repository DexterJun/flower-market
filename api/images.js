const { getImagesHandler } = require('../lib/handlers');
const { createVercelHandler } = require('../lib/vercel-adapter');

// 支持通过 query.dir 动态指定目录，例如 image / hymn-image / video
module.exports = createVercelHandler(getImagesHandler);