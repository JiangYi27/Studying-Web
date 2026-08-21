# 脚本归档说明

这些是一次性修复脚本，已不再需要，仅作历史记录保留。

## _archive/quiz-generation/ — 题库生成脚本
| 文件 | 说明 |
|------|------|
| newq_1.js ~ newq_4.js | 往数据库写入新题目数据（分4批，每批对应若干章节） |
| expand_quizzes.js | 题库扩展脚本（合并新题 + 标注难度 + 校验） |

## _archive/encoding-fixes/ — 编码修复脚本
| 文件 | 说明 |
|------|------|
| fix-encoding.js / fix-encoding2.js / fix-encoding3.js | 修复 index.html / back.html 混合 GBK/UTF8 编码问题 |
| fix-gbk-utf8.js / gbk-to-utf8.js | GBK → UTF8 批量转换 |
| fix-mixed-encoding.js | 混合编码文件修复 |
| fix-title.js | 修复 HTML title 乱码 |
| decode-all.js / decode-step.js / decode-step2.js | 编码调试脚本（分析 index.html 字节） |
| extract-sections.js | 从乱码 index.html 中提取章节内容 |
| restore-html.js | 从备份还原 index.html |

## _archive/diagnostics/ — 诊断工具
| 文件 | 说明 |
|------|------|
| diagnose.js / diagnose2.js | 线上问题诊断（检查 bundle / prod HTML / API 响应） |
| check-*.js / compare-back.js / find-*.js | 各类单次检查脚本（字节、编码、git 状态、用户数据等） |
| validate_quizzes.js | 题库数据校验（检查重复、难度分布） |
| verify-bundles.js | 检查 bundle.js 是否干净（无残留乱码） |

## _archive/deployment/ — 部署相关（旧版）
| 文件 | 说明 |
|------|------|
| make-prod.js / make-prod2.js / make-prod-html.js | 生成生产环境 HTML（被 build.js 替代） |
| regen-prod-html.js | 重新生成 prod HTML |
| add-bundles.js | 向 HTML 添加静态资源引用 |
| serve-prod.js | 本地预览生产 HTML |
| test-login.js / test-login2.js / test-login3.js | 登录接口测试 |

---

**当前活跃脚本：**
- `build.js` — 唯一的构建脚本（CSS/JS 打包 + 生成 index.prod.html）
