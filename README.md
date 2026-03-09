# 🗺️ 奥维地图 Google 源代理 v2.0.4

Cloudflare Worker 代理服务，解决 `mt1.google.com` 无法访问的问题。

**当前版本**: v2.0.4 (2024-03-09)  
**仓库**: https://github.com/miaouai/ov-google-proxy

---

## ✅ 已验证可用

- ✅ 支持 Google 卫星图 (`lyrs=s`)
- ✅ 支持 Google 街道图 (`lyrs=m`)
- ✅ 支持 Google 混合图 (`lyrs=y`)
- ✅ URL 模板格式：`/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x={$x}&y={$y}&z={$z}&s=`

---

## 🚀 快速使用

### 1️⃣ 访问配置页面

直接访问你的 Worker 域名即可获取配置：

```
https://your-worker.workers.dev/
```

页面会显示完整的 XML 配置文件和导入步骤说明。

### 2️⃣ 复制 XML 配置

全选页面上的 XML 配置代码并复制。

### 3️⃣ 导入奥维地图

1. 打开奥维地图 → **系统** → **导入对象**
2. 选择 **"从文本导入"**
3. 粘贴配置，点击确定
4. 在图层列表启用 **"谷歌卫星"**

---

## 📋 技术详情

| 参数 | 值 |
|------|-----|
| **服务器地址** | 你的 Worker 域名 (如 `map.uiai.fun`) |
| **URL 模板** | `/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x={$x}&y={$y}&z={$z}&s=` |
| **支持的 lyrs** | `s` (卫星), `m` (街道), `y` (混合) |
| **最大缩放级别** | 28 |
| **坐标系** | Web Mercator (EPSG:3857) |
| **瓦片尺寸** | 256×256 像素 |

---

## 🔧 部署到 Cloudflare Workers

```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 部署项目
cd /app/working/overvier-google-proxy
wrangler deploy
```

部署后获得类似 `https://your-name.workers.dev` 的地址。

---

## 📜 版本历史

### v2.0.4 (2024-03-09)
- ✅ 根路径直接返回 HTML 配置页面（无需 `/copy`）
- ✅ 自动检测并填充当前 Worker 域名
- ✅ 移除复制按钮和二维码功能，简化为纯配置模板
- ✅ 清晰的导入步骤说明

### v2.0.3 (2024-03-09)
- ✅ 使用验证成功的 URL 模板格式
- ✅ Base64 编码二维码生成修复

### v2.0.0 (2024-03-09)
- ✅ 修复代理路径 (`/vt` 替代 `/maps/vt`)
- ✅ 支持三种地图类型

---

## ❓ 常见问题

**Q: 导入后显示"No Data"？**  
A: 检查 XML 中 `<host>` 字段是否只包含域名（不含 `https://` 前缀）。

**Q: 地图加载很慢？**  
A: Cloudflare Worker 免费额度为每月 10 万次请求，超量后可能限速。

**Q: 如何切换不同类型的地图？**  
A: 修改 XML 中 `<url>` 的 `lyrs` 参数：`s`(卫星)、`m`(街道)、`y`(混合)。

---

**项目地址**: https://github.com/miaouai/ov-google-proxy
