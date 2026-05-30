# 阿彩的宇宙传讯站

这是一个面向用户访问和互动的 Next.js 网站，用来发布每日大众占卜、收集用户选题建议，并在私密后台完成选题、抽牌录入、AI 解析草稿和最终发布。

## 本地启动

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

本地前台：`http://localhost:3000`

本地后台：`http://localhost:3000/admin`

如果 3000 端口被占用，可以使用：

```powershell
npm run dev -- --port 3100
```

## 公开页面

- `/`：每日大众占卜。
- `/topics`：用户选题建议留言板。
- `/archive`：历史大众占卜。
- `/admin`：私密后台。

## 环境变量

复制 `.env.example` 为 `.env`，至少设置：

- `ADMIN_PASSWORD`：后台密码。
- `SESSION_SECRET`：登录态签名密钥。
- `OPENAI_API_KEY`：需要 AI 生成选题和解析时填写。
- `LENORMAND_DB_PATH`：SQLite 数据库路径。

## 部署

公网部署请看 `DEPLOYMENT.md`。这个项目需要保存用户留言和后台内容，推荐部署到有持久化磁盘的 Node.js/Docker 服务器。
