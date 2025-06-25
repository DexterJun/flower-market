// 简单的API测试脚本
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 测试API功能...\n');

  try {
    // 测试本地开发服务器
    const response = await fetch('http://localhost:3000/api/images?page=1&pageSize=5');
    const data = await response.json();

    console.log('✅ API测试成功!');
    console.log('📊 返回数据:', {
      imagesCount: data.images?.length || 0,
      pagination: data.pagination
    });
  } catch (error) {
    console.log('❌ API测试失败 - 这是正常的，因为本地服务器可能没有运行');
    console.log('💡 要测试API，请先运行: cd server && npm start');
  }
}

testAPI(); 