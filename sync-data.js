/*
 * @File name: 
 * @Author: 
 * @Version: 
 * @Date: 2025-07-01 10:43:50
 * @Description: 
 */
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 数据同步脚本
 * 用于将server/src/catalog.json同步到api/catalog.json
 * 过渡期使用，最终建议直接编辑api/catalog.json
 */

const serverCatalogPath = path.join(__dirname, 'server', 'src', 'catalog.json');
const apiCatalogPath = path.join(__dirname, 'api', 'catalog.json');

function syncData() {
  try {
    // 检查源文件是否存在
    if (!fs.existsSync(serverCatalogPath)) {
      console.log('❌ server/src/catalog.json 不存在');
      console.log('💡 建议直接编辑 api/catalog.json');
      return;
    }

    // 读取源文件
    const serverData = fs.readFileSync(serverCatalogPath, 'utf8');

    // 写入目标文件
    fs.writeFileSync(apiCatalogPath, serverData);

    console.log('✅ 数据同步成功: server/src/catalog.json -> api/catalog.json');
    console.log('📝 提示: 为了统一开发和生产环境，建议以后直接编辑 api/catalog.json');

  } catch (error) {
    console.error('❌ 同步失败:', error.message);
  }
}

// 如果作为脚本直接运行
if (require.main === module) {
  syncData();
}

module.exports = { syncData }; 