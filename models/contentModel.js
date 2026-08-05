const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const defaultContentRoot = path.join(__dirname, '../content');
let cachedChapters = null;
let cachedRoot = null;

// 站点化：根据站点 key 解析内容根目录（content-xxx 与 content 平级）
function getContentRoot(siteKey) {
  const root = siteKey && siteKey !== 'c' ? path.join(__dirname, '../content-' + siteKey) : defaultContentRoot;
  return root;
}

function getContentRootFor(site) {
  if (site && site.contentRoot) {
    return path.join(__dirname, '..', site.contentRoot);
  }
  return getContentRoot(site && site.key);
}

// 递归读取 content/ 目录，构建章节树
async function buildStructure(site) {
  const contentRoot = getContentRootFor(site);
  if (cachedRoot === contentRoot && cachedChapters) return cachedChapters;
  const chapters = [];
  const entries = await fs.readdir(contentRoot, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    for (const dir of dirs) {
      const chapterId = dir.name.replace(/^\d+[-_]*/, '');
      const chapter = {
        id: chapterId,
        title: dir.name.replace(/^\d+[-_]*/, ''),
        folder: dir.name,
        sections: []
      };
    const files = await fs.readdir(path.join(contentRoot, dir.name));
    const mdFiles = files.filter(f => f.endsWith('.md')).sort((a, b) => a.localeCompare(b));
    for (const f of mdFiles) {
      chapter.sections.push({
        id: `${dir.name}/${f}`,
        chapterId: dir.name,
        title: f.replace(/^\d+[-_]*/, '').replace('.md', ''),
        sourceFile: path.join(contentRoot, dir.name, f)
      });
    }
    chapters.push(chapter);
  }
  cachedChapters = chapters;
  cachedRoot = contentRoot;
  return chapters;
}

// 获取单个小节完整内容（HTML正文、代码块等）
async function getSectionContent(sectionId, site) {
  const chapters = await buildStructure(site);
  for (const ch of chapters) {
    for (const sec of ch.sections) {
      if (sec.id === sectionId) {
        const raw = await fs.readFile(sec.sourceFile, 'utf-8');
        const { content } = matter(raw); // 支持 front-matter（可选）
        const html = marked(content);
        // 提取代码块（简单正则，可后续用 marked renderer 精确提取）
        const codeRegex = /<pre><code class="language-c">([\s\S]*?)<\/code><\/pre>/g;
        const codeExamples = [];
        let match;
        while ((match = codeRegex.exec(html)) !== null) {
          codeExamples.push(match[1]);
        }
        return {
          title: sec.title,
          html: html,
          codeExamples: codeExamples
        };
      }
    }
  }
  throw new Error('小节未找到');
}

// ==================== 搜索索引缓存 ====================
// 首次搜索时按“内容根目录”构建一次全文索引，之后命中直接复用，
// 避免每次查询都重新全量读盘所有 md 文件。
// 失效策略：仅当 clearCache() 被调用（内容变更后热加载）时清空重建。
const searchIndexCache = new Map(); // contentRoot -> entries[]

async function buildSearchIndex(site) {
  const entries = [];
  // 复用真实 site 对象走 buildStructure，正确处理相对内容目录（content / content-grammar）
  const chapters = await buildStructure(site);
  for (const ch of chapters) {
    for (const sec of ch.sections) {
      const raw = await fs.readFile(sec.sourceFile, 'utf-8');
      entries.push({
        sectionId: sec.id,
        title: sec.title,
        chapter: ch.title,
        // 全文小写化一次，查询时同样小写化即可快速命中
        haystack: raw.toLowerCase(),
        // 保留原始大小写用于展示片段
        snippet: raw.substring(0, 100) + '...',
      });
    }
  }
  return entries;
}

async function searchContent(query, site) {
  const q = String(query || '').toLowerCase();
  if (!q) return [];
  const contentRoot = getContentRootFor(site);
  let entries = searchIndexCache.get(contentRoot);
  if (!entries) {
    entries = await buildSearchIndex(site);
    searchIndexCache.set(contentRoot, entries);
  }
  return entries
    .filter((e) => e.haystack.includes(q))
    .map((e) => ({
      sectionId: e.sectionId,
      title: e.title,
      chapter: e.chapter,
      snippet: e.snippet,
    }));
}

// 手动清除缓存（用于热加载，可选）
function clearCache() {
  cachedChapters = null;
  cachedRoot = null;
  searchIndexCache.clear();
}

module.exports = { buildStructure, getSectionContent, searchContent, clearCache };
