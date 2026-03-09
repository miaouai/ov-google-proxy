// Cloudflare Worker for OviMap Google Map Proxy
// 代理 mt1.google.com 的所有请求
// 
// Version: v2.0.2 (2024-03-09)
// Changelog:
//   v2.0.2 - 修复 host 字段，去除 https:// 前缀；支持更多 URL 参数格式
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
  const xmlContent = XML_CONFIG_TEMPLATE.replace('{WORKER_HOST}', workerHost);
  
  // 返回带复制功能的 HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>奥维地图 - Google 源配置</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #f6f8fa; }
    .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #24292e; }
    .config-box { background: #f6f8fa; padding: 20px; border-radius: 6px; margin: 20px 0; position: relative; }
    textarea { width: 100%; height: 200px; font-family: monospace; font-size: 12px; border: 1px solid #dfe2e5; border-radius: 4px; padding: 10px; resize: vertical; }
    button { background: #2ea44f; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; margin: 10px 5px; }
    button:hover { background: #2c974b; }
    button.secondary { background: #6a737d; }
    button.secondary:hover { background: #5a6268; }
    .qrcode-section { text-align: center; margin: 30px 0; padding: 20px; background: #fafbfc; border-radius: 6px; }
    .qrcode-img { max-width: 300px; border: 2px solid #e1e4e8; border-radius: 4px; }
    .info { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .success { background: #d4edda; border: 1px solid #28a745; border-radius: 4px; padding: 15px; margin: 20px 0; display: none; }
    .debug { background: #f1f8ff; border: 1px solid #2196f3; border-radius: 4px; padding: 15px; margin: 20px 0; font-size: 11px; font-family: monospace; white-space: pre-wrap; }
    .map-types { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🗺️ 奥维地图 - Google 地图源配置</h1>
    
    <div class="info">
      <strong>使用说明：</strong><br>
      1. 点击「复制配置」按钮复制 XML 配置<br>
      2. 在奥维地图中：系统设置 → 导入对象 → 选择 XML 文件或直接粘贴<br>
      3. 或者扫描二维码自动导入配置
    </div>
    
    <div class="map-types">
      <strong>📊 支持的地图类型 (已测试)：</strong><br>
      • Google Hybrid (混合): lyrs=y<br>
      • Google Satellite (卫星): lyrs=s<br>
      • Google Road (街道): lyrs=m<br>
      <br>
      <em>💡 只需要把 mt1.google.com 替换为你的 Worker 域名即可！</em>
    </div>
    
    <div class="success" id="successMsg">✅ 配置已复制到剪贴板！</div>
    
    <h2>XML 配置文件</h2>
    <div class="config-box">
      <textarea id="configText">${xmlContent}</textarea>
    </div>
    
    <div style="text-align: center;">
      <button onclick="copyConfig()">📋 复制配置到剪贴板</button>
      <button class="secondary" onclick="showQRCode()">📱 显示二维码</button>
    </div>
    
    <div class="qrcode-section" id="qrSection" style="display: none;">
      <h3>📱 扫码导入配置</h3>
      <img id="qrImage" class="qrcode-img" alt="配置二维码">
      <p><small>使用奥维地图扫码功能扫描此二维码</small></p>
      <div class="debug" id="debugInfo" style="display:none"></div>
    </div>
    
    <script>
      function copyConfig() {
        const text = document.getElementById('configText').value;
        navigator.clipboard.writeText(text).then(() => {
          document.getElementById('successMsg').style.display = 'block';
          setTimeout(() => {
            document.getElementById('successMsg').style.display = 'none';
          }, 3000);
        }).catch(err => {
          alert('复制失败，请手动复制');
          console.error(err);
        });
      }
      
      function showQRCode() {
        // ✅ 使用验证成功的 URL 模板格式
        var workerHost = '${workerHost}'.replace('https://', '').replace('http://', '').split(':')[0];  // 只保留主机名
        var urlTemplate = '/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x={$x}&y={$y}&z={$z}&s=';
        
        console.log('=== QRCode Debug v2.0.3 ===');
        console.log('Worker Host:', workerHost);
        console.log('URL Template:', urlTemplate);
        
        const qrData = 'ovobj?t=37&id=202&na=6auY5b635Y2r5pif5Zu_&po=0&vr=1&pn=1&mt=1&mf=3&hs=1&he=4&oy=1&df=211,16777215,211,16777215&hn=' + hnBase64 + '&ul=' + ulBase64;
        
        document.getElementById('debugInfo').innerHTML = 
          '调试信息:\\\\n' +
          'Worker 地址：' + workerHost + '\\\\n' +
          'hn (Base64): ' + hnBase64 + '\\\\n' +
          '→ 解码验证：' + atob(hnBase64) + '\\\\n' +
          'ul (Base64): ' + ulBase64 + '\\\\n' +
          '→ 解码验证：' + atob(ulBase64) + '\\\\n\\\\n' +
          '完整二维码数据：\\\\n' + qrData;
        document.getElementById('debugInfo').style.display = 'block';
        
        const qrUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(qrData);
        document.getElementById('qrImage').src = qrUrl;
        document.getElementById('qrSection').style.display = 'block';
      }
    </script>
  </div>
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
    
    console.log(`[v2.0.1] Request: ${request.method} ${pathname}`);
    
    // 🎯 地图瓦片代理 - 核心路由！优先级最高！
    // 支持以下所有形式：
    //   /vt?lyrs=m&x=1&y=1&z=1
    //   /vt/?lyrs=m&x=1&y=1&z=1  
    //   /maps/vt?lyrs=m&x=1&y=1&z=1
    //   /mt1/vt?lyrs=m&x=1&y=1&z=1
    if (pathname.startsWith('/vt') || pathname.startsWith('/maps/') || pathname.startsWith('/mt1/')) {
      console.log(`[v2.0.1] 命中代理路由，转发到 Google`);
      return handleProxyRequest(request);
    }
    
    // 🎯 根路径 - 返回 XML 配置
    if (pathname === '/' || pathname === '/config') {
      return handleXMLConfig(request, workerHost);
    }
    
    // 🎯 GUI 页面
    if (pathname === '/copy' || pathname === '/gui') {
      return handleCopyConfig(request, workerHost);
    }
    
    // 🎯 默认返回 GUI 页面
    return handleCopyConfig(request, workerHost);
  }
};
