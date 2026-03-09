// Cloudflare Worker for OviMap Google Map Proxy
// 代理 mt1.google.com 的所有请求
// 
// Version: v2.0.6 (2024-03-09)
// Changelog:
//   v2.0.6 - 自动获取域名，生成三种地图类型完整配置表格
//   v2.0.5 - 根路径直接返回 HTML 配置页面
//   v2.0.4 - 简化界面为纯配置模板模式，移除复制和二维码功能
//   v2.0.3 - 优化导入配置，使用验证成功的 URL 模板格式
//   v2.0.2 - 修复 host 字段，去除 https:// 前缀；支持更多 URL 参数格式
//   v2.0.1 - 添加版本号标识，修复路由匹配逻辑
//   v2.0.0 - 修复代理路径 (/vt), Base64 编码二维码，支持三种地图源
//   v1.0.0 - 初始版本

const GOOGLE_MAP_URL = 'https://mt1.google.com';

// XML 配置模板
const XML_CONFIG_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
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
  <host>{WORKER_HOST}</host>
  <group>谷歌官方</group>
  <port>443</port>
  <url>/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x={$x}&y={$y}&z={$z}&s=</url>
</customMapSource>`;

async function handleProxyRequest(request) {
  const url = new URL(request.url);
  
  let targetPath = url.pathname;
  let searchParams = url.search;
  
  // 标准化路径
  if (targetPath.startsWith('/maps/vt')) {
    targetPath = targetPath.substring('/maps'.length);
  } else if (targetPath.startsWith('/mt1/vt')) {
    targetPath = targetPath.substring('/mt1'.length);
  }
  
  const targetUrl = `${GOOGLE_MAP_URL}${targetPath}${searchParams}`;
  
  console.log(`[v2.0.6 Proxy] ${request.method} ${targetPath}${searchParams} -> ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
        'Referer': 'https://www.google.com/maps',
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      }
    });
    
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Access-Control-Allow-Origin', '*');
    
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

async function handleCopyConfig(request, workerHost) {
  // 读取 public/index.html 内容（由客户端 JS 动态处理）
  try {
    const html = \`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>奥维地图 Google 源配置 - v2.0.6</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; max-width:1000px; margin:0 auto; padding:30px 20px; background:#f6f8fa; color:#24292e; line-height:1.5; }
        .container { background:white; padding:40px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        h1 { color:#0366d6; margin-bottom:10px; font-size:28px; }
        .version { background:#2ea44f; color:white; padding:4px 10px; border-radius:4px; font-size:13px; display:inline-block; margin-bottom:25px; }
        .info-banner { background:#fff3cd; border-left:4px solid #ffc107; padding:15px; margin:20px 0; border-radius:4px; }
        .server-info { background:#e3f2fd; border:1px solid #2196f3; border-radius:6px; padding:15px; margin:20px 0; font-size:14px; }
        .server-info code { background:#f1f8ff; padding:2px 6px; border-radius:3px; color:#0366d6; }
        .config-grid { display:grid; gap:25px; margin:30px 0; }
        .config-card { background:#fafbfc; border:1px solid #dfe2e5; border-radius:8px; overflow:hidden; }
        .card-header { background:linear-gradient(135deg,#0366d6,#05a0fb); color:white; padding:15px 20px; font-weight:600; font-size:16px; display:flex; align-items:center; justify-content:space-between; }
        .card-header .icon { font-size:20px; }
        .card-body { padding:20px; }
        .config-table { width:100%; border-collapse:collapse; margin:15px 0; font-size:14px; }
        .config-table th { background:#f6f8fa; padding:10px 12px; text-align:left; font-weight:600; width:120px; border-bottom:2px solid #dfe2e5; }
        .config-table td { padding:10px 12px; border-bottom:1px solid #eee; vertical-align:top; }
        .config-code { background:#fff; border:1px solid #dfe2e5; border-radius:4px; padding:12px; font-family:'Consolas','Monaco',monospace; font-size:13px; white-space:pre-wrap; word-break:break-all; margin:10px 0; }
        .copy-hint { font-size:12px; color:#586069; margin-top:8px; font-style:italic; }
        .steps { background:#f1f8ff; border-left:4px solid #2196f3; padding:20px; border-radius:6px; margin:25px 0; }
        .steps h3 { margin-top:0; color:#0366d6; }
        .tip { background:#f0fff4; border-left:4px solid #28a745; padding:12px; margin:15px 0; font-size:14px; border-radius:4px; }
        hr { border:none; border-top:1px solid #e1e4e8; margin:35px 0; }
        footer { text-align:center; margin-top:40px; color:#586069; font-size:13px; }
        footer a { color:#0366d6; text-decoration:none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗺️ 奥维地图 Google 源配置</h1>
        <span class="version">v2.0.6 (2024-03-09)</span>
        
        <div class="info-banner">
            <strong>✅ 已验证可用 | 自动检测域名</strong><br>
            以下配置已根据您的 Worker 域名自动生成，直接复制即可使用。
        </div>
        
        <div class="server-info">
            <strong>🌐 当前服务器信息：</strong><br>
            Worker 域名：<code id="currentDomain">检测中...</code>
        </div>

        <div class="config-grid">
            <!-- 卫星图 -->
            <div class="config-card">
                <div class="card-header"><span><span class="icon">🛰️</span> Google 卫星图</span><span style="font-size:12px;opacity:.9">lyrs=s</span></div>
                <div class="card-body">
                    <p style="margin:0 0 10px 0;color:#586069;font-size:14px;">高清卫星影像，适合查看地形、建筑细节</p>
                    <table class="config-table">
                        <tr><th>名称</th><td>谷歌卫星</td></tr>
                        <tr><th>最大缩放</th><td>28</td></tr>
                        <tr><th>XML 配置</th><td><div class="config-code" id="satXml"></div><div class="copy-hint">全选 → 复制 → 奥维地图 → 系统 → 导入对象 → 从文本导入</div></td></tr>
                    </table>
                </div>
            </div>
            
            <!-- 街道图 -->
            <div class="config-card">
                <div class="card-header"><span><span class="icon">🛣️</span> Google 街道图</span><span style="font-size:12px;opacity:.9">lyrs=m</span></div>
                <div class="card-body">
                    <p style="margin:0 0 10px 0;color:#586069;font-size:14px;">矢量道路地图，适合导航和路线规划</p>
                    <table class="config-table">
                        <tr><th>名称</th><td>谷歌街道</td></tr>
                        <tr><th>最大缩放</th><td>28</td></tr>
                        <tr><th>XML 配置</th><td><div class="config-code" id="roadXml"></div><div class="copy-hint">全选 → 复制 → 奥维地图 → 系统 → 导入对象 → 从文本导入</div></td></tr>
                    </table>
                </div>
            </div>
            
            <!-- 混合图 -->
            <div class="config-card">
                <div class="card-header"><span><span class="icon">🗺️</span> Google 混合图</span><span style="font-size:12px;opacity:.9">lyrs=y</span></div>
                <div class="card-body">
                    <p style="margin:0 0 10px 0;color:#586069;font-size:14px;">卫星图 + 街道标注，兼顾细节与可读性</p>
                    <table class="config-table">
                        <tr><th>名称</th><td>谷歌混合</td></tr>
                        <tr><th>最大缩放</th><td>28</td></tr>
                        <tr><th>XML 配置</th><td><div class="config-code" id="hybridXml"></div><div class="copy-hint">全选 → 复制 → 奥维地图 → 系统 → 导入对象 → 从文本导入</div></td></tr>
                    </table>
                </div>
            </div>
        </div>

        <div class="steps">
            <h3>🚀 三步导入配置</h3>
            <ol>
                <li><strong>选择配置</strong>：根据需要选择卫星/街道/混合图</li>
                <li><strong>复制 XML</strong>：全选上方 XML 代码框内容并复制</li>
                <li><strong>导入奥维</strong>：系统 → 导入对象 → 从文本导入 → 粘贴 → 确定</li>
            </ol>
        </div>

        <div class="tip">
            <strong>💡 提示：</strong>三个配置可同时导入，按需切换。Cloudflare Worker 每月免费 10 万请求。
        </div>
        
        <hr>
        <footer><p>项目：<a href="https://github.com/miaouai/ov-google-proxy" target="_blank">github.com/miaouai/ov-google-proxy</a></p></footer>
    </div>
    <script>
        const host = location.hostname;
        document.getElementById('currentDomain').textContent = location.origin + " (" + host + ")";
        
        function genXML(name,id,lyrs){return \`<?xml version="1.0" encoding="UTF-8"?>
<customMapSource>
  <mapID>\${id}</mapID>
  <name>\${name}</name>
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
  <url>/vt/lyrs=\${lyrs}@699&hl=zh-CN&gl=cn&src=app&x={\$x}&y={\$y}&z={\$z}&s=</url>
</customMapSource>\`;
}
        document.getElementById('satXml').textContent = genXML('谷歌卫星','203','s');
        document.getElementById('roadXml').textContent = genXML('谷歌街道','204','m');
        document.getElementById('hybridXml').textContent = genXML('谷歌混合','205','y');
        console.log('✅ v2.0.6 加载完成 - 域名:',host);
    </script>
</body>
</html>\`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response('Error loading config page', { status: 500 });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const workerHost = url.origin;
    const pathname = url.pathname;
    
    console.log(\`[v2.0.6] \${request.method} \${pathname}\`);
    
    // 🎯 瓦片代理路由（优先级最高）
    if (pathname.startsWith('/vt') || pathname.startsWith('/maps/') || pathname.startsWith('/mt1/')) {
      console.log(\`[v2.0.6] 代理路由 -> Google\`);
      return handleProxyRequest(request);
    }
    
    // 🎯 所有其他路径返回 HTML 配置页面
    console.log(\`[v2.0.6] 返回配置页面\`);
    return handleCopyConfig(request, workerHost);
  }
};
