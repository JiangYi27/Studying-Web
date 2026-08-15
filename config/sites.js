/**
 * 站点注册表
 * 每个学习站点对应一组独立的：内容目录(contentRoot)、题库标识(quizzes)、
 * 前端章节配置标识(chaptersKey)、主题色(theme)、标题文案。
 *
 * 规划时仅有两个站点，故采用“集中的硬编码表”，而非动态多租户注册表。
 * 将来若站点继续增加，只需在 sites 数组追加一项，并保证 contentRoot / quizzes
 * 目录存在、前端 chapters.js 中 SITES 该项存在即可。
 */
module.exports = {
  sites: [
    {
      key: 'c',
      name: 'C语言',
      subtitle: 'C语言 · 知识库',
      contentRoot: 'content',           // 内容根目录（content/*.md）
      quizzes: 'quizzes',               // 前端 from /api/quizzes 加载（对应 data 下的文件前缀）
      chaptersKey: 'c',                 // 前端 chapters.js 的 SITES.c
      theme: { accent: '#3b82f6' },
      logoText: 'lab研习室',
      targetDate: '2027-04-17',
    },
    {
      key: 'grammar',
      name: '英语语法',
      subtitle: 'Grammar · 知识库',
      contentRoot: 'content-grammar',   // 英语语法章节内容目录
      quizzes: 'grammar',               // data/quizzes-grammar.json
      chaptersKey: 'grammar',           // 前端 chapters.js 的 SITES.grammar
      theme: { accent: '#10b981' },
      logoText: 'lab研习室',
      targetDate: '2027-04-17',
    },
  ],
};