// 批量提取电影资源磁力（在浏览器 console 运行，需已登录且候选存于 localStorage）
// 用法:
//   1. localStorage.setItem('cand_real', JSON.stringify([{title, douban, area, link}, ...]))
//      link 形如 https://xxx.com/mv/{movieId}
//   2. 粘贴本脚本执行
//   3. 结果在 localStorage.getItem('mv_all_res')

(async () => {
  const cand = JSON.parse(localStorage.getItem('cand_real') || '[]');
  const out = [];
  for (const c of cand) {
    const id = c.link.split('/mv/')[1];
    if (!id) { out.push({title: c.title, error: 'no id'}); continue; }
    try {
      const resp = await fetch('/res/downurl/mv/' + id);
      const data = await resp.json();
      const l = (data.downlist && data.downlist.list) || {};
      const t = l.t || [], m = l.m || [], s = l.s || [], e = l.e || [];
      const results = [];
      for (let i = 0; i < t.length; i++) {
        const name = (t[i] || '').replace(/\s+/g, ' ').trim();
        if (!name) continue;
        const is4k = /2160|4K|UHD/i.test(name);
        const sizeStr = s[i] || '';
        const sizeGB = sizeStr ? parseFloat(sizeStr) : 0;
        if (is4k && sizeGB > 0 && sizeGB <= 35) { // 4K 且 <=35G
          results.push({
            name: name.slice(0, 90),
            size: sizeStr,
            seeds: e[i] || 0,
            mag: 'magnet:?xt=urn:btih:' + (m[i] || '')
          });
        }
      }
      results.sort((a, b) => b.seeds - a.seeds); // 做种多的优先
      out.push({title: c.title, douban: c.douban, area: c.area, id, results});
    } catch (err) {
      out.push({title: c.title, error: String(err).slice(0, 50)});
    }
    await new Promise(r => setTimeout(r, 300)); // 限速防风控
  }
  localStorage.setItem('mv_all_res', JSON.stringify(out));
  const withRes = out.filter(o => o.results && o.results.length);
  return JSON.stringify({total: out.length, withRes: withRes.length});
})();
