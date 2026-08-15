/* ==================== 登录系统：鉴权门控 + 全局 401 拦截 + 站点选择 ==================== */
/* auth.js 独占应用引导权：roadmap.js 不再自行注册 DOMContentLoaded，
   init() 只有登录并选定站点通过后才会被调用一次。 */
'use strict';
// ==================== 登录背景（Three.js 水面着色器，按需加载） ====================

let loginBgModule = null;
let lBgMounted = false;
function enableLoginBackground(enabled) {
  const bg = document.getElementById('loginBg');
  if (!bg) return;
  if (!enabled) {
    lBgMounted = false;
    if (loginBgModule && typeof loginBgModule.destroy === 'function') loginBgModule.destroy();
    return;
  }
  bg.hidden = false;
  if (lBgMounted) return;
  lBgMounted = true;
  // 防重复加载：动态 import 同路径只执行一次
  import('/js/features/login-bg.mjs')
    .then(function (mod) {
      loginBgModule = mod;
      if (lBgMounted && typeof mod.mount === 'function') mod.mount(bg);
    })
    .catch(function (err) { console.error('[登录背景] 加载失败', err); });
}// ==================== DOM 引用 ====================
function getLoginOverlay() { return document.getElementById('loginOverlay'); }
function getLoginForm() { return document.getElementById('loginForm'); }
function getSitePicker() { return document.getElementById('loginSitePicker'); }

function showLogin() {
  enableLoginBackground(true);
  document.body.classList.add('login-locked');
  const overlay = getLoginOverlay();
  if (overlay) overlay.classList.remove('hidden');
}

function hideLogin() {
  enableLoginBackground(false);
  document.body.classList.remove('login-locked');
  const overlay = getLoginOverlay();
  if (overlay) overlay.classList.add('hidden');
  showLoginLoader();
}

// 登录成功进入应用前的加载过渡（方块堆叠 loader），动画播完一圈后淡出移除。
let loginLoaderTimer = null;
function showLoginLoader() {
  if (loginLoaderTimer) { clearTimeout(loginLoaderTimer); loginLoaderTimer = null; }
  const existing = document.getElementById('loginLoader');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'loginLoader';
  overlay.className = 'login-loader-overlay';
  overlay.innerHTML =
    '<div class="loader">' +
    '  <div class="box box0"><div></div></div>' +
    '  <div class="box box1"><div></div></div>' +
    '  <div class="box box2"><div></div></div>' +
    '  <div class="box box3"><div></div></div>' +
    '  <div class="box box4"><div></div></div>' +
    '  <div class="box box5"><div></div></div>' +
    '  <div class="box box6"><div></div></div>' +
    '  <div class="box box7"><div></div></div>' +
    '  <div class="ground"><div></div></div>' +
    '</div>';
  document.body.appendChild(overlay);
  const visibleMs = 3600; // 播完约一圈后淡出
  loginLoaderTimer = setTimeout(function () {
    overlay.classList.add('fading');
    setTimeout(function () { overlay.remove(); }, 650);
  }, visibleMs);
}

// ==================== 站点选择遮罩 ====================
// 登录成功且账号可访问多个站点时，展示站点列表供选择。
function showSitePicker(sites) {
  const picker = getSitePicker();
  const list = document.getElementById('loginSiteList');
  const label = document.getElementById('loginSiteTitle');
  const overlay = getLoginOverlay();
  if (!picker || !list) return;
  // 站点选择界面不能被 hideLogin() 的全屏过渡 loader 盖住：先移除它
  const loaderEl = document.getElementById('loginLoader');
  if (loaderEl) {
    if (loginLoaderTimer) { clearTimeout(loginLoaderTimer); loginLoaderTimer = null; }
    loaderEl.remove();
  }
  if (label) label.textContent = '选择要进入的学习站点';
  list.innerHTML = '';
  sites.forEach(function (site) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'login-site-btn split-btn';
    btn.dataset.site = site.key;
    btn.textContent = site.name || site.key;
    btn.addEventListener('click', function () {
      selectSite(site.key);
    });
    list.appendChild(btn);
  });
  // 确保遮罩可见（遮罩内含账号密码区与站点选择区）
  if (overlay) overlay.classList.remove('hidden');
  document.body.classList.add('login-locked');
  picker.style.display = '';
  // 隐藏账号密码区，展示选站区
  const form = getLoginForm();
  if (form) form.style.display = 'none';
  const title = document.querySelector('.login-title');
  if (title) title.textContent = 'lab研习室';
}

// 选择站点：通知后端记录 session.site，然后整体刷新进入对应站点
async function selectSite(siteKey) {
  const picker = getSitePicker();
  try {
    const res = await fetch('/api/auth/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: siteKey }),
    });
    if (res.ok) {
      setLoading(true);
      // 选择站点后：全屏方块堆叠 loading 过渡动画，加载完成后停留在主页（不再自动进入闯关游戏）
      showLoginLoader();
      setTimeout(function () {
        window.location.reload();
      }, 700); // 稍作停留让 loader 呈现，随后刷新进入应用
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (picker && data.site) {
      return; // 无权限等
    }
    setLoginError(data.error || '切换站点失败');
  } catch (err) {
    setLoginError('网络错误，请重试');
  }
}

// ==================== 全局 401 拦截 ====================
// 任何 /api 请求返回 401（且非登录接口自身）时，重新弹出登录遮罩（会话过期场景）。
(function intercept401() {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await originalFetch.apply(this, args);
    const url = String(args[0] || '');
    if (res.status === 401 && url.indexOf('/api/auth/') === -1) {
      showLogin();
    }
    return res;
  };
})();

// ==================== 登录 ====================
function setLoading(loading) {
  const btn = document.getElementById('loginSubmitBtn');
  const spinner = document.getElementById('loginSpinner');
  const label = document.getElementById('loginSubmitLabel');
  if (btn) { btn.disabled = loading; }
  if (spinner) spinner.classList.toggle('d-none', !loading);
  if (label) label.textContent = loading ? '登录中...' : '登 录';
}

function setLoginError(msg) {
  const err = document.getElementById('loginError');
  if (err) err.textContent = msg || '';
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    setLoginError('请输入账号和密码');
    return;
  }

  setLoading(true);
  setLoginError('');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      // 多个可访问站点 → 展示站点选择；否则（单站点）直接进入
      if (data.sites && data.sites.length > 1) {
        setLoading(false);
        showSitePicker(data.sites);
        return;
      }
      // 单站点：服务端已自动选定默认站，直接刷新进入
      window.location.reload();
      return;
    }
    setLoginError(data.error || '登录失败，请重试');
  } catch (err) {
    setLoginError('网络错误，请重试');
  } finally {
    setLoading(false);
  }
}

// ==================== 退出登录 ====================
async function handleLogout(e) {
  if (e) e.preventDefault();
  const dropdownEl = document.querySelector('.dropdown');
  try {
    const inst = bootstrap.Dropdown.getInstance(dropdownEl);
    if (inst) inst.hide();
  } catch (_) {}
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (_) {}
  // 清除本地状态（所有站点的状态 key，含旧版单一 key）
  Object.keys(localStorage)
    .filter(function (k) { return k.indexOf('c_knowledge_base_state') === 0; })
    .forEach(function (k) { localStorage.removeItem(k); });
  localStorage.removeItem('c_study_records');
  localStorage.removeItem('CHECKIN_STORAGE_KEY');
  window.location.reload();
}

// ==================== 渲染下拉用户信息块 ====================
function renderDropdownUser() {
  const me = window.__currentUser;
  const user = (me && me.user) || {};
  const nameEl = document.getElementById('dropdownUserName');
  const roleEl = document.getElementById('dropdownUserRole');
  if (nameEl) nameEl.textContent = user.displayName || user.username || '管理员';
  if (roleEl) {
    const role = user.role || '管理员';
    roleEl.innerHTML = '<i class="fas fa-crown"></i> ' + role;
  }
}

// ==================== 切换站点入口（顶栏下拉） ====================
function bindSiteSwitcher() {
  const container = document.getElementById('siteSwitchDropdown');
  if (!container) return;
  container.innerHTML = '';
  const me = window.__currentUser;
  const sites = (me && me.sites) || [];
  const current = (me && me.site) || null;
  sites.forEach(function (site) {
    const key = site.key || site;
    const item = document.createElement('a');
    item.className = 'dropdown-item' + (key === current ? ' active' : '');
    item.href = '#';
    item.innerHTML = '<i class="fas fa-globe"></i> ' + (site.name || key) + (key === current ? ' <small>·当前</small>' : '');
    item.addEventListener('click', function (e) {
      e.preventDefault();
      if (key === current) return;
      selectSite(key);
    });
    container.appendChild(item);
  });
}

// ==================== 应用站点配置（标题/副标题/主题色） ====================
async function applySiteConfig(me) {
  // 优先从 /me 的 sites 中找当前站点，没有则请求 /api/site/config
  let cfg = null;
  const current = (me && me.site) || null;
  const sites = (me && me.sites) || [];
  if (current && sites.length) {
    cfg = sites.find(function (s) { return s.key === current; }) || null;
  }
  if (!cfg) {
    try {
      const r = await fetch('/api/site/config');
      if (r.ok) cfg = await r.json();
    } catch (_) {}
  }
  if (!cfg) return;
  const subtitle = document.getElementById('loginSubtitle');
  if (subtitle) subtitle.textContent = cfg.subtitle || '';
  const logoText = document.getElementById('logoText');
  if (logoText && cfg.logoText) logoText.textContent = cfg.logoText;
  const welcomeSub = document.getElementById('welcomeName');
  if (welcomeSub && cfg.name) welcomeSub.textContent = cfg.name + '学习者';
  // 页面标题与任务面板标题（随站点切换）
  const siteName = (cfg && cfg.name) || '知识库';
  document.title = siteName + ' · 知识库';
  const questTitle = document.getElementById('questTitle');
  if (questTitle) questTitle.textContent = '探索' + siteName + '世界';
  // 主题色
  if (cfg.theme && cfg.theme.accent) {
    document.documentElement.style.setProperty('--accent', cfg.theme.accent);
  }
}

// ==================== 引导 ====================
function initAuth() {
  // 登录前即应用深色偏好（扫描任意站点的状态 key，兼容旧版单一 key）
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('c_knowledge_base_state') === 0) {
        const saved = JSON.parse(localStorage.getItem(k));
        if (saved && saved.darkMode) { document.body.classList.add('dark'); break; }
      }
    }
  } catch (_) {}

  const form = getLoginForm();
  if (form) form.addEventListener('submit', handleLogin);


  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  bindSiteSwitcher();

  fetch('/api/auth/me')
    .then(function (res) {
      if (res.ok) {
        return res.json();
      }
      throw new Error('未登录');
    })
    .then(function (me) {
      window.__currentUser = me;
      hideLogin();
      // 下拉用户信息块
      renderDropdownUser();
      // 站点切换下拉绑定
      bindSiteSwitcher();
      // 已登录但尚未选定站点（多站点账号）：展示站点选择卡，不进入应用
      if (me.hasSite === false || !me.site) {
        if (me.sites && me.sites.length > 1) {
          showSitePicker(me.sites);
          return;
        }
        // 单站点账号理论上服务端已自动选定，若仍未选则尝试进入
        if (me.sites && me.sites.length === 1) {
          selectSite(me.sites[0].key);
          return;
        }
      }
      // 应用站点数据（章节/语录/目标）
      if (typeof setSite === 'function') setSite(me.site || 'c');
      // 应用站点标题/副标题/主题
      applySiteConfig(me);
      // 站点已选定：启动应用
      if (typeof init === 'function') init();
    })
    .catch(function () {
      showLogin();
      if (typeof setSite === 'function') setSite('c');
    });
}

document.addEventListener('DOMContentLoaded', initAuth);