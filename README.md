# 电影资源站自动化

![GitHub stars](https://img.shields.io/github/stars/ninggui/movie-resource-automation)
![License](https://img.shields.io/github/license/ninggui/movie-resource-automation)
[![SkillHub](https://img.shields.io/badge/SkillHub-在线安装-blue)](https://skillhub.cn/skills/movie-resource-automation)

登录→筛选→API 提取磁力→缓存：批量搜索高分片单。

## 这是什么

一个可复用的 AI Agent 技能（Skill），来自真实业务场景沉淀，含完整执行流程、避坑清单与验证步骤。

## 快速使用

将本仓库放入 Agent 技能目录后，用对应触发词调用（见 SKILL.md），Agent 会自动加载并执行完整流程。

## 核心能力

| 能力 | 说明 |
|------|------|
| 站内评分榜批量筛选 |
| 详情 API 磁力提取（中字/国配/全集优先） |
| 批量去重登记 |
| 一键复制磁力列表 |

## 使用方式（安装）

- **Hermes**: 放入 `skills/` 目录
- **Claude**: 放入 `~/.claude/skills/`
- **其他 Agent**: 按对应 SKILL.md 格式放入技能目录
- **SkillHub 一键安装**: https://skillhub.cn/skills/movie-resource-automation

## 优势

- 一次任务可出百部片单
- 评分/地区/画质多维筛选
- 频率控制防 ban

## 内容结构

- `SKILL.md` — 核心技能定义（触发条件、执行流程、避坑清单）
- `references/` — 可选参考文件

## 许可

MIT
