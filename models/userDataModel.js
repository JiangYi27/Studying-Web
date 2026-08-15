const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const dataRoot = path.join(__dirname, '../data');

// 用户数据按 用户×站点 分文件：data/users/<username>/<site>.json
function userDataFile(username, siteKey) {
  const safeUser = String(username || 'unknown').replace(/[^\w一-龥.-]/g, '_');
  const safeSite = String(siteKey || 'default').replace(/[^\w-]/g, '_');
  return path.join(dataRoot, 'users', safeUser, safeSite + '.json');
}

async function ensureDir(file) {
  await fs.mkdir(path.dirname(file), { recursive: true });
}

// 迁移：旧版单站点数据 data/user_data.json -> data/users/<name>/c.json
async function migrateLegacy(username) {
  const legacy = path.join(dataRoot, 'user_data.json');
  try {
    const raw = await fs.readFile(legacy, 'utf-8');
    const data = JSON.parse(raw);
    const target = userDataFile(username, 'c');
    await ensureDir(target);
    // 仅在目标不存在时迁移，避免覆盖
    try {
      await fs.access(target);
    } catch {
      await fs.writeFile(target, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch {
    /* 无旧数据或读取失败则忽略 */
  }
}

async function readData(username, site) {
  const siteKey = (site && site.key) || 'default';
  const file = userDataFile(username, siteKey);
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    if (siteKey === 'c') await migrateLegacy(username);
    return {};
  }
}

async function writeData(username, site, data) {
  const siteKey = (site && site.key) || 'default';
  const file = userDataFile(username, siteKey);
  await ensureDir(file);
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

// 标记进度：status 为 1 已完成，0 未完成
async function toggleProgress(username, site, sectionId, status) {
  const data = await readData(username, site);
  const siteKey = (site && site.key) || 'default';
  if (siteKey === 'c') {
    // C 站兼容旧字段
    if (!data.progress) data.progress = {};
    if (!data.completedSections) data.completedSections = {};
    data.progress[sectionId] = !!status;
    data.completedSections[sectionId] = !!status;
  } else {
    // 其他站点统一用 completedSections
    if (!data.completedSections) data.completedSections = {};
    data.completedSections[sectionId] = !!status;
  }
  await writeData(username, site, data);
}

async function getCompletedSet(username, site) {
  const data = await readData(username, site);
  const map = (data.completedSections && Object.keys(data.completedSections).length > 0)
    ? data.completedSections
    : (data.progress || {});
  return Object.keys(map).filter(k => map[k]);
}

async function saveNote(username, site, sectionId, note) {
  const data = await readData(username, site);
  if (!data.notes) data.notes = {};
  data.notes[sectionId] = {
    content: note,
    updatedAt: new Date().toISOString()
  };
  await writeData(username, site, data);
}

async function getNote(username, site, sectionId) {
  const data = await readData(username, site);
  return (data.notes && data.notes[sectionId]) || null;
}

module.exports = {
  toggleProgress,
  getCompletedSet,
  saveNote,
  getNote,
  readData,
  writeData,
  userDataFile,
  migrateLegacy,
};