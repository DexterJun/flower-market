# 花卉市场项目部署指南

## 🚀 Vercel + Vercel Functions 部署方案

### 1. 项目结构
```
flower-market/
├── api/                    # Vercel Functions API
│   ├── images.js          # 获取图片列表API
│   └── search.js          # 模糊搜索图片API
├── src/                   # Vue前端代码
├── public/                # 静态资源
├── vercel.json            # Vercel配置文件
└── package.json           # 项目依赖
```

### 2. 功能特性

#### 🔍 智能搜索功能
- **模糊搜索**: 支持包含任意位置关键词的搜索，不仅限于前缀匹配
- **实时搜索**: 300ms防抖延迟，避免频繁API调用
- **分页支持**: 搜索结果支持无限滚动分页加载
- **性能优化**: 分批处理OSS文件，避免超时问题
- **智能排序**: 搜索结果按文件名字母顺序排列

#### 📱 用户体验
- **无限滚动**: 自动加载更多内容，无需手动翻页
- **瀑布流布局**: 响应式图片展示，适配各种屏幕尺寸
- **全屏预览**: 点击图片查看高清大图
- **侧边抽屉**: 快速浏览所有图片目录

### 3. 部署步骤

#### 步骤1：推送代码到GitHub
```bash
git add .
git commit -m "feat: 添加Vercel Functions支持"
git push origin main
```

#### 步骤2：连接Vercel项目
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的GitHub仓库
4. 导入项目

#### 步骤3：配置环境变量
在Vercel项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `OSS_REGION` | 阿里云OSS区域 | `oss-cn-beijing` |
| `ALIBABA_CLOUD_ACCESS_KEY_ID` | 阿里云访问密钥ID | `LTAI5t...` |
| `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | 阿里云访问密钥Secret | `xxx...` |
| `OSS_BUCKET` | OSS存储桶名称 | `szzf-bucket` |

#### 步骤4：部署
1. 点击 "Deploy" 按钮
2. 等待构建完成
3. 访问分配的域名

### 4. API端点

部署后，你的API端点将是：
- **获取图片列表**: `https://your-domain.vercel.app/api/images`
  - 支持分页参数: `page`, `pageSize`, `marker`
- **模糊搜索图片**: `https://your-domain.vercel.app/api/search`
  - 支持参数: `query`(搜索关键词), `page`, `pageSize`

### 5. 本地开发

#### 前端开发：
```bash
npm run dev
```

#### 后端开发（使用原Express服务器）：
```bash
cd server
npm start
```

### 6. 环境配置

项目会根据 `NODE_ENV` 自动切换API地址：
- 开发环境: `http://localhost:3000/api`
- 生产环境: `/api` (相对路径)

### 7. 优势

✅ **成本低**: Vercel免费额度足够个人项目使用
✅ **部署简单**: 一键部署，自动构建
✅ **性能好**: 全球CDN加速
✅ **维护方便**: 前后端一体化管理
✅ **自动HTTPS**: 免费SSL证书
✅ **自动缩放**: 根据流量自动扩缩容
✅ **智能搜索**: 支持模糊匹配和实时搜索

### 8. 注意事项

1. **环境变量**: 确保在Vercel中正确配置所有环境变量
2. **API限制**: Vercel Functions有执行时间限制（10秒）
3. **冷启动**: 第一次访问可能稍慢，这是正常现象
4. **域名**: 可以在Vercel中配置自定义域名
5. **搜索性能**: 搜索功能会分批处理OSS文件，大量文件时可能需要几秒钟

### 9. 故障排除

如果遇到问题：
1. 检查Vercel部署日志
2. 确认环境变量配置正确
3. 检查API函数代码是否有语法错误
4. 查看浏览器网络面板的错误信息
5. 搜索功能慢？检查OSS中的文件数量，考虑优化搜索策略

---

## 🔧 其他部署方案

### 方案二：前后端分离部署

**前端**: 继续使用Vercel
**后端**: 使用Railway/Render等服务

1. 将server目录单独部署到Railway
2. 更新前端API配置指向后端URL
3. 配置CORS允许前端域名访问

### 方案三：全栈部署到Railway

将整个项目部署到Railway，同时运行前后端：

1. 创建Railway项目
2. 连接GitHub仓库
3. 配置启动命令和环境变量
4. 部署

---

推荐使用**方案一（Vercel Functions）**，因为配置最简单，成本最低！ 