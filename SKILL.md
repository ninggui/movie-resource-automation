---
name: movie-resource-automation
description: 电影资源站自动搜索筛选磁力链接。用户给资源站+账号时用：登录→筛选→API提取磁力→115/qBittorrent缓存。
---

# 电影资源自动化（影视站搜索/筛选/磁力提取）

## 触发条件
- 用户提供影视资源站域名+账号，要求搜索电影/剧集、筛选下载链接、缓存到网盘
- 用户要求"给XX类型电影的下载链接"（如 2026年+4K+豆瓣≥7+地区过滤+≤35G）

## 核心流程（实测验证，2026-08-13）

> 可复用脚本：`scripts/batch_extract_magnets.js`（浏览器 console 批量提取磁力，含 4K≤35G 过滤与做种排序）

### 1. 访问与登录
- 站点有 JS 安全验证（"安全验证"进度条）→ 等计算完 → "登录后访问受限内容" → 点"立即登录"
- 登录页：`textbox 用户名` + `textbox 密码` + `button 登录`
- **cookie 是 HttpOnly**，`document.cookie` 读不到，但**同源 fetch 自动携带**——这是关键，后续全部用同源 fetch

### 2. 搜索与筛选 URL（SPA 前端路由参数）
```
/mv?year=2026&sort=score&quality=4k&page=N
```
- 电影列表=`/mv`，剧集=`/tv`，动漫=`/ac`
- 筛选参数：`year`=年份、`area`=地区、`quality`=画质(720P/1080P/4K/BD/HDR/DV/原盘)、`sort=score`(评分最高)、`page`
- 列表项评分：**链接文本第一个浮点数是 IMDB 分，豆瓣分只在详情页**

### 3. 核心 API：资源提取（最重要发现）
```
GET /res/downurl/mv/{movieId}   →  JSON
```
`movieId` 从详情页 URL `/mv/{id}` 取。返回 `downlist.list` 字段：
| 字段 | 含义 |
|------|------|
| `m` | 磁力哈希数组（拼 `magnet:?xt=urn:btih:{hash}`）|
| `t` | 标题数组（含清晰度/音轨/字幕信息，可正则判断 4K）|
| `s` | 大小数组（"2.19G"格式，解析浮点判断 ≤35G）|
| `e` | 做种数数组（选种用）|
| `n` | 发布时间数组 |

### 4. 批量提取模式（browser_console 内 fetch 循环）
```js
(async () => {
  const cand = JSON.parse(localStorage.getItem('cand_real') || '[]');
  const out = [];
  for (const c of cand) {
    const id = c.link.split('/mv/')[1];
    const resp = await fetch('/res/downurl/mv/' + id);
    const data = await resp.json();
    const l = (data.downlist && data.downlist.list) || {};
    // l.t / l.m / l.s / l.e 并行数组，按 index 关联
    // 过滤: /2160|4K|UHD/i.test(name) && parseFloat(size)<=35 && size含GB
    await new Promise(r => setTimeout(r, 300)); // 限速防风控
  }
  localStorage.setItem('mv_all_res', JSON.stringify(out));
})();
```

### 5. 数据跨页传递（关键模式）
- 浏览器跳转会中断 async 循环 → **逐页 navigate + 每页单独 browser_console 提取**，存 `localStorage`（`mv_p1`/`mv_p2`...），最后合并
- 列表 DOM 提取：`main li` 内的 `h3`=标题，`li.innerText` 含评分/地区/年份；**注意抓取时可能误抓页面底部推荐区**——用 `li.textContent.includes('4K') && /\d{4}\s*\//.test(text)` 过滤主列表

### 6. 过滤规则（用户常用）
1. 地区：欧美/大陆/港台（美国/英国/法国/德国/加拿大/澳/意/西/俄/大陆/香港/台湾/爱尔兰）
2. 豆瓣 ≥7（进详情页确认，列表页只有 IMDB）
3. 2026 年更新（URL `year=` 参数）
4. 4K(2160p) 且 ≤35G（`s` 字段解析）

### 6b. 20G 优先规则（2026-08-13 用户两次纠正，铁律）
- **用户明确反馈**："有的资源总占用内存只有三个g，这个肯定不是高清的。你尽量把它下载到大小在20g左右，实在没有20g的选择最高清晰度的"
- 3-5G 的"4K"是 YTS/低码率压缩版 → **画质不可信，必须剔除**
- 筛选算法：每部电影
  1. 先取 15-25G 区间（最接近20G优先）
  2. 无 15-25G → 选该片最大版本（但≤35G）
  3. 纪录片/脱口秀/短片（片长<90min）常常只有小体积版本 → 标记"无大体积版，已选最高码"，如实告知用户
- 实现参考：`/path/to/data/reselect_movies.py`（已含 33 部实测数据）

### 6c. 磁力输出格式（用户指定）
- **一行一条**，每部两行：`电影名 (大小G)` + 磁力链接行，方便直接复制粘贴到 115/qBittorrent
- 用纯文本代码块发送，不要用表格（用户要的是复制粘贴方便）

## 115 网盘风控边界（重要，2026-08-13 研究确认）
- **2026-06-01 起 115 专项治理（"剑网2026"，至 11 月）**，三条红线：盗版影视内容、第三方接口/脚本自动化、账号合买
- 处罚阶梯：功能限制→封号→永久注销；仅存储也可能触发（哈希比对+AI识别）
- **结论**：共用账号（用户+家人）**不要**做第三方 API 自动化（如 115driver MCP）；推荐方案：
  - B 方案（当前采用）：我负责搜索+提取磁力，用户手动粘贴到 115 官方离线下载
  - A 方案（无账号风险）：本地 qBittorrent + CloudDrive2/Emby 播放
  - 自动化（C 方案）等整治期过后再评估

## Pitfalls
- 直接 `requests`/curl 抓列表页拿不到数据（SPA 壳，且需登录 cookie）→ 必须浏览器会话 + 同源 fetch
- 列表页评分是 IMDB 不是豆瓣，别用错过滤字段
- 详情页资源区是异步加载（"加载中..."），需等待 3s+ 再提取
- 磁力链接完整性：`magnet:?xt=urn:btih:{m[i]}` 直接拼，不要依赖页面 a 标签 href（可能被截断）
- 账号密码敏感 → 存本地文件（如 `/path/to/data/site_credentials.txt`），不写入对话/skill
