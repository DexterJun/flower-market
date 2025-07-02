# 歌曲管理功能使用说明

## 功能概述

新增的歌曲管理功能允许您通过Web界面添加新的歌曲到诗歌集中，包括：

- 歌曲基本信息录入
- 音频文件上传（MP3格式）
- 视频文件上传（MP4格式）
- 事件管理（支持动态添加/删除）
- 自动生成唯一ID并写入catalog.json

## 访问方式

1. **前端页面访问**：`/#/hymn/manage`
2. **API接口**：
   - 文件上传：`POST /api/hymn/upload`
   - 新增歌曲：`POST /api/hymn/add`

## 环境配置

使用前请确保已配置阿里云OSS环境变量（参考 `env.template`）：

```env
# 阿里云OSS配置
OSS_REGION=oss-cn-beijing
OSS_BUCKET=your-bucket-name
ALIBABA_CLOUD_ACCESS_KEY_ID=your-access-key-id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-access-key-secret
```

## 数据结构

### 表单字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | ✅ | 歌曲名称，用于生成文件名 |
| index | number | ✅ | 歌曲编号，必须唯一 |
| tag | string | ❌ | 歌曲标签 |
| title | string | ❌ | 歌曲标题 |
| lyrics | string | ❌ | 歌词内容 |
| sheetMusic | file | ❌ | 歌谱图片（支持JPG、PNG、GIF） |
| audio | file | ❌ | 音频文件（仅支持MP3） |
| events | array | ❌ | 事件列表（可动态添加） |

**注意**：图片格式信息会从上传的歌谱文件中自动获取，无需手动输入。

### 事件(Event)字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 事件名称 |
| date | string | 事件日期 (YYYY-MM-DD) |
| description | string | 事件描述 |
| videos | array | 视频文件列表 |

## 文件处理规则

### 歌谱图片
- **格式限制**：支持JPG、JPEG、PNG、GIF格式
- **数量限制**：每首歌曲仅能上传1张歌谱图片
- **文件重命名**：上传后自动重命名为 `${filename}.${原始扩展名}`
- **存储位置**：阿里云OSS `/hymn-image/` 目录下
- **格式自动识别**：系统会自动从上传文件中提取图片格式

### 音频文件
- **格式限制**：仅支持MP3格式
- **数量限制**：每首歌曲仅能上传1个音频文件
- **文件重命名**：上传后自动重命名为 `${filename}.mp3`
- **存储位置**：阿里云OSS `/audio/` 目录下

### 视频文件
- **格式限制**：仅支持MP4格式
- **数量限制**：每个事件可上传多个视频文件
- **文件重命名**：上传后自动重命名为 `${filename}.mp4`
- **存储位置**：阿里云OSS `/video/` 目录下

## API接口详细说明

### 文件上传接口

**请求方式**：`POST /api/hymn/upload`

**请求格式**：multipart/form-data

**请求参数**：
```javascript
{
  file: File,      // 上传的文件
  type: string,    // 'audio'、'video' 或 'image'
  filename: string // 歌曲名称，用于重命名
}
```

**响应格式**：
```javascript
{
  success: boolean,
  message: string,
  filename: string,  // 重命名后的文件名
  url: string,       // 文件的完整URL
  path: string,      // 文件在OSS上的路径
  extension: string  // 文件扩展名（仅图片类型返回）
}
```

### 新增歌曲接口

**请求方式**：`POST /api/hymn/add`

**请求格式**：application/json

**请求参数**：
```javascript
{
  filename: string,
  index: number,
  type?: string,
  tag?: string,
  detail: {
    title?: string,
    audio?: string,
    lyrics?: string,
    events?: [
      {
        name: string,
        date: string,
        description: string,
        videos: string[]
      }
    ]
  }
}
```

**响应格式**：
```javascript
{
  success: boolean,
  message: string,
  data: {
    id: string,        // 自动生成的唯一ID
    filename: string,
    index: number,
    type: string,
    tag: string,
    detail: {
      title: string,
      audio: string,
      lyrics: string,
      events: array
    }
  }
}
```

## 使用流程

1. **访问管理页面**：导航到 `/#/hymn/manage`
2. **填写基本信息**：输入歌曲名称（必填）和编号（必填）
3. **上传歌谱图片**：选择JPG、PNG或GIF格式的歌谱图片（可选）
   - 图片格式会自动识别并设置
4. **上传音频文件**：选择MP3格式的音频文件（可选）
5. **管理事件**：
   - 填写事件信息
   - 上传相关视频文件
   - 可点击"添加事件"添加多个事件
   - 可点击"删除事件"移除不需要的事件
6. **提交保存**：点击"提交"按钮完成添加

## 注意事项

1. **歌曲编号唯一性**：系统会检查编号是否已存在，重复编号将提交失败
2. **文件格式严格**：音频文件必须是MP3，视频文件必须是MP4
3. **网络环境**：文件上传需要稳定的网络连接
4. **权限要求**：确保阿里云OSS配置正确且具有上传权限
5. **文件大小**：建议单个文件不超过100MB以确保上传稳定性

## 故障排除

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| "缺少必要的环境变量" | OSS配置不完整 | 检查.env.local文件中的OSS配置 |
| "歌曲编号已存在" | 编号重复 | 使用不同的歌曲编号 |
| "图片文件只支持JPG、PNG、GIF格式" | 图片格式错误 | 使用JPG、PNG或GIF格式的图片文件 |
| "音频文件只支持MP3格式" | 文件格式错误 | 使用MP3格式的音频文件 |
| "视频文件只支持MP4格式" | 文件格式错误 | 使用MP4格式的视频文件 |
| "文件上传失败" | 网络或权限问题 | 检查网络连接和OSS权限配置 |

如遇到其他问题，请检查浏览器控制台的错误信息以获取更多详细信息。 