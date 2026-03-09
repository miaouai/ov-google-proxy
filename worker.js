// Cloudflare Worker for OviMap Google Map Proxy
// 代理 mt1.google.com 的所有请求
// 
// Version: v2.0.4 (2024-03-09)
// Changelog:
//   v2.0.2 - 修复 host 字段，去除 https:// 前缀；支持更多 URL 参数格式
//   v2.0.4 - 简化界面为纯配置模板模式，移除复制和二维码功能
//   v2.0.3 - 优化导入配置，使用验证成功的 URL 模板格式
//   v2.0.1 - 添加版本号标识，修复路由匹配逻辑
//   v2.0.0 - 修复代理路径 (/vt), Base64 编码二维码，支持三种地图源
//   v1.0.0 - 初始版本

const GOOGLE_MAP_URL = 'https://mt1.google.com';

// 奥维配置 XML 模板
const XML_CONFIG_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<customMapSource>
  <mapID>203</mapID>
  <name>谷歌街道</name>
  <version>0</version>
  <maxZoom>28</maxZoom>
  <coordType>Mercator</coordType>
  <tileType>Satellite</tileType>
  <tileFormat>JPG</tileFormat>
  <tileSize>256</tileSize>
  <protocol>https</protocol>
  <host>{WORKER_HOST}</host>
  <group>谷歌官方</group>
  <port>443</port>
  <url>/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x={$x}&y={$y}&z={$z}&s=</url>
</customMapSource>`;

async function handleXMLConfig(request, workerHost) {
  // 从完整 URL 中提取纯主机名 (去除协议和端口)
  const url = new URL(workerHost);
  const hostOnly = url.hostname;  // ✅ 只返回域名部分
  
  const xmlContent = XML_CONFIG_TEMPLATE.replace('{WORKER_HOST}', hostOnly);
  
  return new Response(xmlContent, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function handleCopyConfig(request, workerHost) {
  // 提取纯主机名
  const url = new URL(workerHost);
  const hostOnly = url.hostname;
  
  // 使用已验证的 URL 模板
  const urlTemplate = '/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x={$x}&y={$y}&z={$z}&s=';
  
  // 生成完整 HTML（内联 JS 处理动态内容）
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>奥维地图 Google 源配置 - v2.0.4</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:900px;margin:0 auto;padding:40px 20px;background:#f6f8fa}
    .container{background:white;padding:40px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
    h1{color:#24292e;margin-bottom:10px}
    .version{background:#0366d6;color:white;padding:5px 12px;border-radius:4px;font-size:14px;display:inline-block;margin-bottom:20px}
    .info-box{background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0}
    .config-section{background:#f6f8fa;border:2px solid #dfe2e5;border-radius:6px;padding:25px;margin:20px 0}
    .config-title{font-weight:bold;color:#24292e;margin-bottom:15px;font-size:16px}
    .config-code{background:white;border:1px solid #dfe2e5;border-radius:4px;padding:20px;font-family:"Consolas","Monaco",monospace;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-all}
    .step{background:#e3f2fd;border-radius:6px;padding:20px;margin:20px 0}
    .step h3{margin-top:0;color:#0366d6}
    code{background:#f6f8fa;padding:2px 8px;border-radius:3px;font-size:13px}
    table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px}
    th,td{border:1px solid #dfe2e5;padding:12px;text-align:left}
    th{background:#f6f8fa;font-weight:600;width:200px}
    .tip{background:#f1f8ff;border-left:4px solid #2196f3;padding:12px;margin:15px 0}
    hr{border:none;border-top:1px solid #e1e4e8;margin:40px 0}
  </style>
</head>
<body>
  <div class="container">
    <h1>🗺️ 奥维地图 Google 源配置</h1>
    <span class="version">v2.0.4 (2024-03-09)</span>
    
    <div class="info-box">
      <strong>✅ 已验证可用</strong><br>
      当前 Worker 域名：<code id="currentHost">-</code><br>
      URL 模板：<code>/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x=\{$x\}&y=\{$y\}&z=\{$z\}&s=</code>
    </div>
    
    <div class="config-section">
      <div class="config-title">XML 配置文件：</div>
      <div class="config-code" id="xmlConfig"></div>
    </div>
    
    <div class="step">
      <h3>🚀 导入步骤</h3>
      <ol>
        <li>全选上方 XML 配置并复制</li>
        <li>打开奥维地图 → 系统 → 导入对象</li>
        <li>选择"从文本导入"</li>
        <li>粘贴配置并确定</li>
        <li>在图层列表启用"谷歌卫星"</li>
      </ol>
    </div>
    
    <hr>
    <table>
      <tr><th>服务器</th><td id="serverUrl"></td></tr>
      <tr><th>URL 模板</th><td><code>/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x=\{$x\}&y=\{$y\}&z=\{$z\}&s=</code></td></tr>
      <tr><th>最大缩放</th><td>28</td></tr>
    </table>
  </div>
  <script>
    const host = location.hostname;
    const tmpl = "/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x={\$x}&y={\$y}&z={\$z}&s=";
    const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<customMapSource>
  <mapID>203</mapID>
  <name>谷歌卫星</name>
  <version>0</version>
  <maxZoom>28</maxZoom>
  <coordType>Mercator</coordType>
  <tileType>Satellite</tileType>
  <tileFormat>JPG</tileFormat>
  <tileSize>256</tileSize>
  <protocol>https</protocol>
  <host>\${host}</host>
  <group>谷歌官方</group>
  <port>443</port>
  <url>\${tmpl}</url>
</customMapSource>\`;
    document.getElementById('xmlConfig').textContent = xml;
    document.getElementById('currentHost').textContent = "https://" + host;
    document.getElementById('serverUrl').innerHTML = "<a href="https://" + host + "" target="_blank">https://" + host + "</a>";
  <\/script>
</body>
</html>`;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// ✅ 核心代理函数 - 支持所有 Google Maps 瓦片请求
async function handleProxyRequest(request) {
  const url = new URL(request.url);
  
  // 支持 /vt/... 或 /mt1/vt/... 或直接 /vt?... 等多种路径
  let targetPath = url.pathname;
  let searchParams = url.search;
  
  // 标准化路径：移除可能的前缀
  if (targetPath.startsWith('/maps/vt')) {
    targetPath = targetPath.substring('/maps'.length);
  } else if (targetPath.startsWith('/mt1/vt')) {
    targetPath = targetPath.substring('/mt1'.length);
  }
  
  // 构建目标 URL
  const targetUrl = `${GOOGLE_MAP_URL}${targetPath}${searchParams}`;
  
  console.log(`[Proxy] ${request.method} ${targetPath}${searchParams} -> ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.google.com/maps',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`[Proxy] Response: ${response.status} ${response.headers.get('Content-Type')}`);
    
    // 复制重要响应头
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');  // 缓存 24 小时
    headers.set('Access-Control-Allow-Origin', '*');
    
    if (response.headers.get('Expires')) {
      headers.set('Expires', response.headers.get('Expires'));
    }
    
    return new Response(response.body, {
      status: response.status,
      headers: headers
    });
  } catch (error) {
    console.error('[Proxy Error]', error);
    return new Response(`Proxy error: ${error.message}`, { 
      status: 502,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const workerHost = url.origin;
    const pathname = url.pathname;
    
    console.log(`[v2.0.4] Request: ${request.method} ${pathname}`);
    
    // 🎯 地图瓦片代理 - 核心路由！优先级最高！
    if (pathname.startsWith('/vt') || pathname.startsWith('/maps/') || pathname.startsWith('/mt1/')) {
      console.log(`[v2.0.4] 命中代理路由，转发到 Google`);
      return handleProxyRequest(request);
    }
    
    // 🎯 根路径 - 直接返回 HTML 配置页面 (v2.0.4 更新)
    if (pathname === '/' || pathname === '/config' || pathname === '/copy' || pathname === '/gui') {
      return handleCopyConfig(request, workerHost);
    }
    
    // 🎯 默认返回 HTML 配置页面
    return handleCopyConfig(request, workerHost);
  }
};
