/* ==================== 登录页视频壁纸配置 ==================== */
'use strict';

/* 四个视频壁纸，供 login.ejs 和 settings 页视频选择器共用 */
window.LOGIN_VIDEOS = [
  { id: 'grassland', label: '暮原', src: '/video/grassland.mp4' },
  { id: 'forest',    label: '静湖', src: '/video/forest.mp4'   },
  { id: 'city',      label: '寒林', src: '/video/city.mp4'     },
  { id: 'gallery',   label: '晨溪', src: '/video/gallery.mp4'  },
];

/* VIDEO_BG_MAP：供 video-background.js（settings 视频壁纸）使用 */
window.VIDEO_BG_MAP = {};
window.LOGIN_VIDEOS.forEach(function(v) {
  window.VIDEO_BG_MAP[v.id] = v.src;
});
