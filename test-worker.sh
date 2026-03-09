#!/bin/bash
# 测试 map.uiai.fun Worker 是否正常
# Version: v2.0.1

WORKER_URL="https://map.uiai.fun"

echo "========================================"
echo "🗺️ 奥维地图 Google 源代理测试工具 v2.0.1"
echo "========================================"
echo ""

# 测试 1: XML 配置
echo "【测试 1】根路径 - 获取 XML 配置"
RESPONSE=$(curl -s -w "\n%{http_code}" "${WORKER_URL}/")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
CONTENT=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] && echo "$CONTENT" | grep -q "customMapSource"; then
    echo "✅ 成功！返回 XML 配置 (HTTP $HTTP_CODE)"
    echo "   前 5 行预览:"
    echo "$CONTENT" | head -5 | sed 's/^/   /'
else
    echo "❌ 失败！HTTP $HTTP_CODE"
    echo "   内容：$(echo "$CONTENT" | head -1)"
fi
echo ""

# 测试 2: GUI 页面
echo "【测试 2】/copy 路径 - GUI 配置页面"
RESPONSE=$(curl -s -w "\n%{http_code}" "${WORKER_URL}/copy")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
CONTENT_TYPE=$(curl -s -I "${WORKER_URL}/copy" | grep -i content-type | awk '{print $2}' | tr -d ',')

if [ "$HTTP_CODE" = "200" ] && echo "$CONTENT_TYPE" | grep -q "text/html"; then
    echo "✅ 成功！返回 HTML 页面 (HTTP $HTTP_CODE, Content-Type: $CONTENT_TYPE)"
else
    echo "❌ 失败！HTTP $HTTP_CODE"
fi
echo ""

# 测试 3: 瓦片代理 - 核心测试！
echo "【测试 3】/vt 路径 - 地图瓦片代理 (关键！)"
RESPONSE=$(curl -s -w "\n%{http_code}" "${WORKER_URL}/vt?lyrs=m&x=100&y=100&z=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
CONTENT=$(echo "$RESPONSE" | head -n -1)
CONTENT_TYPE=$(curl -s -I "${WORKER_URL}/vt?lyrs=m&x=100&y=100&z=5" | grep -i content-type | awk '{print $2}' | tr -d ',')

if [ "$HTTP_CODE" = "200" ] && ! echo "$CONTENT" | grep -q "<!DOCTYPE html"; then
    echo "✅ 成功！返回图片数据 (HTTP $HTTP_CODE, Content-Type: $CONTENT_TYPE)"
    SIZE=${#CONTENT}
    echo "   数据大小：约 $((SIZE / 1024)) KB"
else
    echo "❌ 失败！应该是图片，但返回了其他内容"
    echo "   HTTP: $HTTP_CODE, Content-Type: $CONTENT_TYPE"
    echo "   内容预览: $(echo "$CONTENT" | head -c 100)"
fi
echo ""

# 测试 4: 卫星图
echo "【测试 4】/vt lyrs=s - 卫星图瓦片"
RESPONSE=$(curl -s -w "\n%{http_code}" "${WORKER_URL}/vt?lyrs=s&x=100&y=100&z=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 成功！卫星图可用 (HTTP $HTTP_CODE)"
else
    echo "❌ 失败！HTTP $HTTP_CODE"
fi
echo ""

# 测试 5: 混合图
echo "【测试 5】/vt lyrs=y - 混合图瓦片"
RESPONSE=$(curl -s -w "\n%{http_code}" "${WORKER_URL}/vt?lyrs=y&x=100&y=100&z=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 成功！混合图可用 (HTTP $HTTP_CODE)"
else
    echo "❌ 失败！HTTP $HTTP_CODE"
fi
echo ""

echo "========================================"
echo "📊 测试完成！"
echo "========================================"
echo ""
echo "💡 如果【测试 3】失败，说明 Worker 代理逻辑有问题"
echo "   请检查 Cloudflare Worker 是否部署了最新版本 v2.0.1"
echo ""
