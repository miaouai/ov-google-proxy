# 🗺️ ov-google-proxy - 奥维地图 Google 源代理

Cloudflare Worker 实现的项目文件

## 📁 目录结构

```
overvier-google-proxy/
├── wrangler.toml          # Cloudflare Worker 配置
├── worker.js              # Worker 核心代码
├── public/
│   └── index.html         # Web 界面（XML 配置 + 二维码）
├── README.md              # 项目说明文档
└── .gitignore             # Git 忽略规则
```

## 🔧 部署方式

### 方式一：Cloudflare Workers（推荐）

1. 安装 Wrangler CLI:
```bash
npm install -g wrangler
```

2. 登录 Cloudflare:
```bash
wrangler login
```

3. 部署:
```bash
cd /app/working/overvier-google-proxy
wrangler deploy
```

4. 获取访问地址后，按使用说明操作

### 方式二：其他平台适配

项目的 `worker.js` 可以适配到其他 Serverless 平台：
- Vercel
- Netlify Functions  
- AWS Lambda (需稍作修改)

## 📱 使用方式

部署成功后，访问你的 Worker 域名即可：

1. **根路径** (`https://your-worker.workers.dev`)
   - 显示 XML 配置文件
   - 提供复制按钮和二维码生成

2. **配置页面** (`/copy`)
   - 更友好的用户界面

3. **API 端点**
   - `/maps/vt?lyrs=m&x={$x}&y={$y}&z={$z}` - 地图瓦片代理

## 🎯 核心功能

1. ✅ 代理 mt1.google.com 的地图请求
2. ✅ 自动生成奥维地图 XML 配置
3. ✅ 支持剪贴板复制
4. ✅ 生成二维码方便手机导入

## 🔐 安全说明

- 所有请求通过 Cloudflare 中转
- 不会暴露你的真实 IP
- 符合 Cloudflare 服务条款

## 📚 相关文档

详细说明请查看 [README.md](./README.md)

---

*该项目已推送到 https://github.com/miaouai/ov-google-proxy*
