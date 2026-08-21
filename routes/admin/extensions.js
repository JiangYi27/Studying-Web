/**
 * 拓展文档管理路由（Word 文档上传/删除/预览）
 * 依赖：express, fs, path, multer, extensionModel
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const extensionModel = require('../../models/extensionModel');

const extDir = path.join(__dirname, '..', '..', 'knowledge', 'extension');
const extStorage = multer.diskStorage({
  destination: extDir,
  filename: (req, file, cb) => {
    const original = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = path.basename(original).replace(/[\/\\:*?"<>|]/g, '-');
    cb(null, safeName);
  },
});
const extUpload = multer({ storage: extStorage, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/upload', extUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.docx', '.doc'].includes(ext)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: '仅支持 .docx 和 .doc 文件' });
  }
  res.json({ success: true, fileName: req.file.filename });
});

router.delete('/:fileName', (req, res) => {
  try {
    const filePath = path.join(extDir, path.basename(req.params.fileName));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (e) {
    console.error('[admin/extension/delete]', e);
    res.status(500).json({ error: '删除文件失败' });
  }
});

router.get('/preview/:fileName', (req, res) => {
  try {
    extensionModel.getHtml(decodeURIComponent(req.params.fileName)).then(html => {
      res.json({ success: true, html });
    }).catch(() => res.status(404).json({ error: '预览失败' }));
  } catch (e) {
    console.error('[admin/extension/preview]', e);
    res.status(500).json({ error: '预览失败' });
  }
});

module.exports = router;
