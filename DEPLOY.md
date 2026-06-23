# 部署到 Railway（公开链接，任何设备可玩）

游戏是纯静态前端。`main.py` 是一个零依赖的 Python 静态服务器，把 `prototype/` 作为网站根目录，
带 no-cache 头，监听 Railway 注入的 `$PORT`。已包含部署所需全部文件：

```
StartupLifeSim/
├── main.py            # 静态服务器（serve prototype/，读 $PORT）
├── Procfile           # web: python main.py
├── requirements.txt   # 触发 Python 识别（无第三方依赖）
├── runtime.txt        # python-3.11.9
├── railway.json       # 显式 startCommand
├── .gitignore         # 不上线 _test/unity/docs
└── prototype/         # 游戏本体（index.html 在这里，会成为根 /）
```

部署根目录 = **`StartupLifeSim/`**（不是 `prototype/`，也不是外层 `模拟器/`）。

---

## 方法 A：Railway CLI（推荐，不需要 Git/GitHub）

```bash
# 1. 安装 CLI（需要 Node/npm；或去 railway.app/cli 下载二进制）
npm i -g @railway/cli

# 2. 登录（会打开浏览器授权）
railway login

# 3. 进入部署目录
cd H:\模拟器\StartupLifeSim

# 4. 创建项目
railway init          # 取个项目名，回车

# 5. 上传并部署当前目录
railway up

# 6. 生成公开域名
railway domain        # 输出形如 https://xxxx.up.railway.app
```

把第 6 步的链接发给别人，任何设备的浏览器打开即可玩。

---

## 方法 B：GitHub（适合以后持续更新）

```bash
cd H:\模拟器\StartupLifeSim
git init
git add .
git commit -m "deploy: startup life sim"
# 在 GitHub 新建一个空仓库，然后：
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

然后在 **railway.app** 网页：
1. New Project → Deploy from GitHub repo → 选这个仓库
2. Railway 自动识别 Python + railway.json，开始构建
3. 部署成功后：Settings → Networking → **Generate Domain** → 得到公开链接

以后改完游戏 `git push`，Railway 自动重新部署。

---

## 说明

- **存档**：游戏存档跑在每台设备各自的浏览器里（localStorage）。别人打开是各玩各的，互不影响。
  想要"跨设备同一份存档/云存档/排行榜"才需要真正的后端——那是另一件事，需要时再加。
- **费用**：这点静态流量极小，Railway 的 Hobby/试用额度足够；空闲时几乎不耗资源。
- **更新即生效**：no-cache 头保证玩家每次打开都是最新版本，不会卡在旧缓存。
- **自定义域名**：Railway 项目 Settings → Networking → Custom Domain，可绑你自己的域名。
