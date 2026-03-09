#!/bin/bash
# 推送 Ovier Google Proxy 项目到 GitHub

REPO_NAME="ov-google-proxy"
WORKING_DIR="/app/working/overvier-google-proxy"

echo "🚀 准备推送项目到 GitHub..."
echo "仓库名称：$REPO_NAME"
echo "工作目录：$WORKING_DIR"

# 检查是否设置了 GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 未找到 GITHUB_TOKEN 环境变量"
    echo "请设置后重新运行："
    echo "export GITHUB_TOKEN='ghp_xxxxx'"
    exit 1
fi

cd $WORKING_DIR

# 创建 GitHub 仓库（公开）
echo "📦 正在创建 GitHub 仓库..."
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"奥维地图 Google 源 Cloudflare Worker 代理\"}" > /tmp/create_repo.json

cat /tmp/create_repo.json | jq '.html_url'

# 添加远程仓库
echo "🔗 添加远程仓库..."
git remote add origin "https://github.com/miaouai/$REPO_NAME.git"

# 推送到 main 分支
echo "📤 推送代码到 main 分支..."
git push -u origin main -f

# 启用 GitHub Pages
echo "🌐 启用 GitHub Pages..."
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/miaouai/$REPO_NAME/pages \
  -d '{"source":{"branch":"main","path":"/"}}'

echo ""
echo "✅ 部署完成！"
echo "📱 访问地址：https://miaouai.github.io/$REPO_NAME/"
echo "📄 仓库地址：https://github.com/miaouai/$REPO_NAME"
