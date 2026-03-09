// Cloudflare Worker for OviMap Google Map Proxy
// 代理 mt1.google.com 的所有请求
// 
// Version: v2.0.8 (2024-03-09)
// Changelog:
//   v2.0.8 - 移除 Workers Sites 依赖，直接返回 HTML 字符串（兼容所有部署环境）
//   v2.0.7 - 使用 Workers Sites 服务静态 HTML
//   v2.0.6 - 自动获取域名，生成三种地图类型完整配置表格，新增实时测试地图
//   v2.0.5 - 根路径直接返回 HTML 配置页面
//   v2.0.0 - 修复代理路径 (/vt), Base64 编码二维码，支持三种地图源

const GOOGLE_MAP_URL = 'https://mt1.google.com';

async function handleProxyRequest(request) {
  const url = new URL(request.url);
  
  let targetPath = url.pathname;
  let searchParams = url.search;
  
  if (targetPath.startsWith('/maps/vt')) {
    targetPath = targetPath.substring('/maps'.length);
  } else if (targetPath.startsWith('/mt1/vt')) {
    targetPath = targetPath.substring('/mt1'.length);
  }
  
  const targetUrl = GOOGLE_MAP_URL + targetPath + searchParams;
  
  console.log('[v2.0.8 Proxy] ' + request.method + ' ' + targetPath + searchParams);
  
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
    return new Response('Proxy error: ' + error.message, { 
      status: 502,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

function getHtml() {
  // 返回完整的 HTML 页面（不含任何 ${} 模板字面量，避免语法错误）
  return '<!DOCTYPE html>\n' +
'<html lang="zh-CN">\n' +
'<head>\n' +
'    <meta charset="UTF-8">\n' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'    <title>奥维地图 Google 源配置 - v2.0.8</title>\n' +
'    <style>\n' +
'        * { box-sizing: border-box; }\n' +
'        body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; max-width: 1000px; margin: 0 auto; padding: 30px 20px; background: #f6f8fa; color: #24292e; line-height: 1.5; }\n' +
'        .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }\n' +
'        h1 { color: #0366d6; margin-bottom: 10px; font-size: 28px; }\n' +
'        .version { background: #2ea44f; color: white; padding: 4px 10px; border-radius: 4px; font-size: 13px; display: inline-block; margin-bottom: 25px; }\n' +
'        .info-banner { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }\n' +
'        .server-info { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 15px; margin: 20px 0; font-size: 14px; }\n' +
'        .server-info code { background: #f1f8ff; padding: 2px 6px; border-radius: 3px; color: #0366d6; }\n' +
'        .test-map-section { background: #f0fff4; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }\n' +
'        .test-map-title { font-weight: 600; color: #28a745; font-size: 16px; margin-bottom: 15px; }\n' +
'        .test-map-img { border: 2px solid #28a745; border-radius: 4px; max-width: 300px; height: auto; box-shadow: 0 2px 8px rgba(40,167,69,0.2); }\n' +
'        .test-map-status { margin-top: 10px; font-size: 14px; }\n' +
'        .status-success { color: #28a745; font-weight: 600; }\n' +
'        .status-error { color: #dc3545; font-weight: 600; }\n' +
'        .test-map-hint { font-size: 12px; color: #586069; margin-top: 8px; }\n' +
'        .config-grid { display: grid; gap: 25px; margin: 30px 0; }\n' +
'        .config-card { background: #fafbfc; border: 1px solid #dfe2e5; border-radius: 8px; overflow: hidden; }\n' +
'        .card-header { background: linear-gradient(135deg,#0366d6,#05a0fb); color: white; padding: 15px 20px; font-weight: 600; font-size: 16px; display: flex; align-items: center; justify-content: space-between; }\n' +
'        .card-header .icon { font-size: 20px; }\n' +
'        .card-body { padding: 20px; }\n' +
'        .config-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }\n' +
'        .config-table th { background: #f6f8fa; padding: 10px 12px; text-align: left; font-weight: 600; width: 120px; border-bottom: 2px solid #dfe2e5; }\n' +
'        .config-table td { padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: top; }\n' +
'        .config-code { background: #fff; border: 1px solid #dfe2e5; border-radius: 4px; padding: 12px; font-family: "Consolas","Monaco",monospace; font-size: 13px; white-space: pre-wrap; word-break: break-all; margin: 10px 0; }\n' +
'        .copy-hint { font-size: 12px; color: #586069; margin-top: 8px; font-style: italic; }\n' +
'        .steps { background: #f1f8ff; border-left: 4px solid #2196f3; padding: 20px; border-radius: 6px; margin: 25px 0; }\n' +
'        .steps h3 { margin-top: 0; color: #0366d6; }\n' +
'        .tip { background: #f0fff4; border-left: 4px solid #28a745; padding: 12px; margin: 15px 0; font-size: 14px; border-radius: 4px; }\n' +
'        hr { border: none; border-top: 1px solid #e1e4e8; margin: 35px 0; }\n' +
'        footer { text-align: center; margin-top: 40px; color: #586069; font-size: 13px; }\n' +
'        footer a { color: #0366d6; text-decoration: none; }\n' +
'    </style>\n' +
'</head>\n' +
'<body>\n' +
'    <div class="container">\n' +
'        <h1>🗺️ 奥维地图 Google 源配置</h1>\n' +
'        <span class="version">v2.0.8 (2024-03-09)</span>\n' +
'        \n' +
'        <div class="info-banner">\n' +
'            <strong>✅ 已验证可用 | 自动检测域名 | 实时状态测试</strong><br>\n' +
'            以下配置已根据您的 Worker 域名自动生成。\n' +
'        </div>\n' +
'        \n' +
'        <div class="server-info">\n' +
'            <strong>🌐 当前服务器信息：</strong><br>\n' +
'            Worker 域名：<code id="currentDomain">检测中...</code>\n' +
'        </div>\n' +
'\n' +
'        <div class="test-map-section">\n' +
'            <div class="test-map-title">🧪 代理状态测试（x=1, y=1, z=1）</div>\n' +
'            <img id="testMapImg" class="test-map-img" alt="测试地图加载中..." src="">\n' +
'            <div class="test-map-status" id="testMapStatus">\n' +
'                <span class="status-error">⏳ 正在加载测试地图...</span>\n' +
'            </div>\n' +
'            <div class="test-map-hint">\n' +
'                💡 如果看到世界地图缩略图，说明代理正常工作！\n' +
'            </div>\n' +
'        </div>\n' +
'\n' +
'        <div class="config-grid">\n' +
'            <div class="config-card">\n' +
'                <div class="card-header"><span><span class="icon">🛰️</span> Google 卫星图</span><span style="font-size:12px;opacity:.9">lyrs=s</span></div>\n' +
'                <div class="card-body">\n' +
'                    <p style="margin:0 0 10px 0;color:#586069;font-size:14px;">高清卫星影像，适合查看地形、建筑细节</p>\n' +
'                    <table class="config-table">\n' +
'                        <tr><th>名称</th><td>谷歌卫星</td></tr>\n' +
'                        <tr><th>最大缩放</th><td>28</td></tr>\n' +
'                        <tr><th>XML 配置</th><td><div class="config-code" id="satXml"></div><div class="copy-hint">全选 → 复制 → 奥维地图 → 系统 → 导入对象 → 从文本导入</div></td></tr>\n' +
'                    </table>\n' +
'                </div>\n' +
'            </div>\n' +
'            \n' +
'            <div class="config-card">\n' +
'                <div class="card-header"><span><span class="icon">🛣️</span> Google 街道图</span><span style="font-size:12px;opacity:.9">lyrs=m</span></div>\n' +
'                <div class="card-body">\n' +
'                    <p style="margin:0 0 10px 0;color:#586069;font-size:14px;">矢量道路地图，适合导航和路线规划</p>\n' +
'                    <table class="config-table">\n' +
'                        <tr><th>名称</th><td>谷歌街道</td></tr>\n' +
'                        <tr><th>最大缩放</th><td>28</td></tr>\n' +
'                        <tr><th>XML 配置</th><td><div class="config-code" id="roadXml"></div><div class="copy-hint">全选 → 复制 → 奥维地图 → 系统 → 导入对象 → 从文本导入</div></td></tr>\n' +
'                    </table>\n' +
'                </div>\n' +
'            </div>\n' +
'            \n' +
'            <div class="config-card">\n' +
'                <div class="card-header"><span><span class="icon">🗺️</span> Google 混合图</span><span style="font-size:12px;opacity:.9">lyrs=y</span></div>\n' +
'                <div class="card-body">\n' +
'                    <p style="margin:0 0 10px 0;color:#586069;font-size:14px;">卫星图 + 街道标注，兼顾细节与可读性</p>\n' +
'                    <table class="config-table">\n' +
'                        <tr><th>名称</th><td>谷歌混合</td></tr>\n' +
'                        <tr><th>最大缩放</th><td>28</td></tr>\n' +
'                        <tr><th>XML 配置</th><td><div class="config-code" id="hybridXml"></div><div class="copy-hint">全选 → 复制 → 奥维地图 → 系统 → 导入对象 → 从文本导入</div></td></tr>\n' +
'                    </table>\n' +
'                </div>\n' +
'            </div>\n' +
'        </div>\n' +
'\n' +
'        <div class="steps">\n' +
'            <h3>🚀 三步导入配置</h3>\n' +
'            <ol>\n' +
'                <li><strong>验证状态</strong>：确认上方测试地图正常显示</li>\n' +
'                <li><strong>选择配置</strong>：根据需要选择卫星/街道/混合图</li>\n' +
'                <li><strong>导入奥维</strong>：全选 XML 代码 → 复制 → 系统 → 导入对象 → 从文本导入 → 粘贴 → 确定</li>\n' +
'            </ol>\n' +
'        </div>\n' +
'\n' +
'        <div class="tip">\n' +
'            <strong>💡 提示：</strong>三个配置可同时导入，按需切换。Cloudflare Worker 每月免费 10 万请求。\n' +
'        </div>\n' +
'        \n' +
'        <hr>\n' +
'        <footer><p>项目：<a href="https://github.com/miaouai/ov-google-proxy" target="_blank">github.com/miaouai/ov-google-proxy</a></p><p>Version v2.0.8 | 自动检测域名 + 实时测试地图</p></footer>\n' +
'    </div>\n' +
'\n' +
'    <script>\n' +
'        (function() {\n' +
'            var currentHost = location.hostname;\n' +
'            var currentUrl = location.origin;\n' +
'            document.getElementById("currentDomain").textContent = currentUrl + " (" + currentHost + ")";\n' +
'            \n' +
'            function generateXML(name, id, lyrs) {\n' +
'                return "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n' +
'<customMapSource>\\n' +
'  <mapID>" + id + "</mapID>\\n' +
'  <name>" + name + "</name>\\n' +
'  <version>0</version>\\n' +
'  <maxZoom>28</maxZoom>\\n' +
'  <coordType>Mercator</coordType>\\n' +
'  <tileType>Satellite</tileType>\\n' +
'  <tileFormat>JPG</tileFormat>\\n' +
'  <tileSize>256</tileSize>\\n' +
'  <protocol>https</protocol>\\n' +
'  <host>" + currentHost + "</host>\\n' +
'  <group>谷歌官方</group>\\n' +
'  <port>443</port>\\n' +
'  <url>/vt/lyrs=" + lyrs + "@699&hl=zh-CN&gl=cn&src=app&x={$x}&y={$y}&z={$z}&s=</url>\\n' +
'</customMapSource>";\n' +
'            }\n' +
'            \n' +
'            document.getElementById("satXml").textContent = generateXML("谷歌卫星", "203", "s");\n' +
'            document.getElementById("roadXml").textContent = generateXML("谷歌街道", "204", "m");\n' +
'            document.getElementById("hybridXml").textContent = generateXML("谷歌混合", "205", "y");\n' +
'            \n' +
'            var testUrl = currentUrl + "/vt/lyrs=s@699&hl=zh-CN&gl=cn&src=app&x=1&y=1&z=1&s=";\n' +
'            var testImg = document.getElementById("testMapImg");\n' +
'            var statusEl = document.getElementById("testMapStatus");\n' +
'            testImg.src = testUrl;\n' +
'            \n' +
'            testImg.onload = function() {\n' +
'                statusEl.innerHTML = "<span class=\\"status-success\\">✅ 代理测试成功！地图正常显示</span>";\n' +
'                console.log("✅ v2.0.8 测试地图加载成功 - 域名:", currentHost);\n' +
'            };\n' +
'            testImg.onerror = function() {\n' +
'                statusEl.innerHTML = "<span class=\\"status-error\\">❌ 代理测试失败！请检查 Worker</span>";\n' +
'                console.error("❌ v2.0.8 测试地图加载失败 - 域名:", currentHost);\n' +
'            };\n' +
'            \n' +
'            console.log("✅ v2.0.8 配置页面加载完成 - 域名:", currentHost);\n' +
'        })();\n' +
'    </script>\n' +
'</body>\n' +
'</html>';
}

export default {
  async fetch(request, env, ctx) {
    var url = new URL(request.url);
    var pathname = url.pathname;
    
    console.log('[v2.0.8] ' + request.method + ' ' + pathname);
    
    // 🎯 瓦片代理路由（优先级最高）
    if (pathname.startsWith('/vt') || pathname.startsWith('/maps/') || pathname.startsWith('/mt1/')) {
      console.log('[v2.0.8] 代理路由 -> Google');
      return handleProxyRequest(request);
    }
    
    // 🎯 所有其他路径返回 HTML 配置页面
    console.log('[v2.0.8] 返回 HTML 配置页面');
    return new Response(getHtml(), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
