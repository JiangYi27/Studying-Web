const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');

const extensionRoot = path.join(__dirname, '..', 'content-English');
const cachedList = [];
const htmlCache = new Map(); // id -> html
const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const extractor = (function () { try { return new WordExtractor(); } catch (e) { return null; } })();

// 支持 docx 与 .doc 两种 Word 文件（按扩展名过滤）
const WORD_RE = /\.(docx|doc)$/i;

function toTitle(name) {
  return name.replace(/\.(docx|doc)$/i, '');
}

function isOle(buf) {
  return OLE_MAGIC.every((b, i) => buf[i] === b);
}

// 把纯文本按行拆成段落 HTML（用于 .doc 老格式，无排版信息）
function linesToHtml(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => '<p>' + escapeHtml(line) + '</p>')
    .join('\n');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 列出拓展知识文档（按文件名排序）
async function list() {
  if (cachedList.length > 0) return cachedList;
  const entries = await fs.readdir(extensionRoot, { withFileTypes: true });
  const list = entries
    .filter((e) => e.isFile() && WORD_RE.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN', { numeric: true }))
    .map((e) => ({
      id: e.name, // 文件名（含扩展名）作为唯一 id
      file: e.name,
      title: toTitle(e.name),
    }));
  for (const item of list) cachedList.push(item);
  return cachedList;
}

// 将单个 Word 转换为 HTML（docx→mammoth，doc(OLE)→word-extractor 纯文本转段落）
async function getHtml(id) {
  if (htmlCache.has(id)) return htmlCache.get(id);
  const target = path.basename(id); // 防目录穿越
  const filePath = path.join(extensionRoot, target);
  let html;
  try {
    const buf = await fs.readFile(filePath);
    if (isOle(buf)) {
      // 老版 .doc（OLE 复合文档）
      if (!extractor) throw new Error('word-extractor 不可用');
      const doc = await extractor.extract(filePath);
      html = linesToHtml(doc.getBody());
    } else {
      // 新版 .docx（zip）
      const result = await mammoth.convertToHtml({ buffer: buf });
      html = result.value || '';
    }
  } catch (err) {
    html = '<p class="text-danger">无法解析该文档：' + escapeHtml(err.message) + '</p>';
  }
  htmlCache.set(id, html);
  return html;
}

module.exports = { list, getHtml, extensionRoot };
