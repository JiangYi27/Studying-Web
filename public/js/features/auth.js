/* ==================== 应用侧鉴权：/app 引导 + 站点切换 + 401 拦截 + 登出 ==================== */
/* 登录前页面是独立 EJS（views/login.ejs + login-page.js），不在此文件。
   本文件只负责 /app 应用壳的引导：已登录则初始化应用；未登录/会话过期跳回登录页。
   登录/注册/选站表单逻辑在 public/js/login-page.js。 */
'use strict';

// ==================== 全局 401 拦截 + CSRF Token ====================
// 任何 /api 请求返回 401（且非登录接口自身）时，会话过期 → 整页跳回登录页。
// 同时自动为所有非 GET 请求附加 CSRF token。
(function intercept401() {
  var originalFetch = window.fetch;
  window.fetch = async function (...args) {
    var url = String(args[0] || '');
    var options = args[1] || {};

    // 为非 GET/HEAD/OPTIONS 请求自动附加 CSRF token
    var method = (options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      var csrfToken = sessionStorage.getItem('csrfToken');
      if (csrfToken) {
        options = Object.assign({}, options);
        options.headers = Object.assign({}, options.headers || {});
        options.headers['x-csrf-token'] = csrfToken;
      }
    }

    var res = await originalFetch.call(this, url, options);
    if (res.status === 401 && url.indexOf('/api/auth/') === -1) {
      if (window.location.pathname !== '/') {
        window.location.replace('/');
      }
    }
    return res;
  };
})();

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

  // 默认头像
  const defaultAvatar = '/image/admin-avatar.png';
  const hasCustomAvatar = user.avatar && user.avatar.trim() !== '';
  const avatarSrc = hasCustomAvatar ? user.avatar : defaultAvatar;

  // 更新顶栏按钮头像
  const topAvatar = document.getElementById('topAvatar');
  if (topAvatar) {
    topAvatar.src = avatarSrc;
    // 始终显示头像（默认或自定义），fallback 仅在图片加载失败时显示
    const fallback = topAvatar.parentNode.querySelector('.user-avatar-fallback');
    if (fallback) {
      fallback.style.display = 'none'; // 默认隐藏fallback
    }
  }

  // 更新下拉菜单内头像
  const dropdownAvatar = document.getElementById('dropdownAvatar');
  const dropdownAvatarFallback = document.getElementById('dropdownAvatarFallback');
  if (dropdownAvatar) {
    if (hasCustomAvatar) {
      dropdownAvatar.src = avatarSrc;
      dropdownAvatar.style.display = '';
      if (dropdownAvatarFallback) dropdownAvatarFallback.style.display = 'none';
    } else {
      dropdownAvatar.style.display = 'none';
      if (dropdownAvatarFallback) dropdownAvatarFallback.style.display = 'flex';
    }
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
  const logoText = document.getElementById('logoText');
  if (logoText && cfg.logoText) logoText.textContent = cfg.logoText;
  // 按站点切换 logo 图片（顶栏）
  if (cfg.logo) {
    const topLogo = document.getElementById('logoImg');
    if (topLogo) topLogo.src = cfg.logo;
  }
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

// ==================== 选择站点（顶栏下拉原地切换，不刷新页面） ====================
// POST /api/auth/select → 重新取 /me → setSite + applySiteConfig + init 原地重建。
async function selectSite(siteKey) {
  try {
    const res = await fetch('/api/auth/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: siteKey }),
    });
    if (res.ok) {
      const me = await fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null));
      if (me && me.site === siteKey) {
        window.__currentUser = me;
        applySiteConfig(me);
        if (typeof setSite === 'function') setSite(siteKey);
        // 背单词功能仅限英语语法站点（可见性由 data-feature=vocabulary 控制）
        var vocabEl = document.getElementById('vocabNavItem');
        if (vocabEl) vocabEl.href = '/vocabulary.html?site=' + siteKey;
        // 强制标记脏数据，确保切换站点后章节树和仪表盘立即重建
        if (typeof chapterTreeDirty !== 'undefined') chapterTreeDirty = true;
        if (typeof dashboardDirty !== 'undefined') dashboardDirty = true;
        // 重新初始化当前站点内容
        if (typeof init === 'function') init();
        // 更新顶栏用户信息（头像/名字/站点下拉）
        renderDropdownUser();
        bindSiteSwitcher();
        if (typeof renderBadgeButton === 'function') renderBadgeButton();
      } else {
        window.location.replace('/'); // 异常：回登录页
      }
    }
  } catch (_err) {
    // 网络错误静默
  }
}

// ==================== 退出登录 ====================
async function handleLogout(e) {
  if (e) e.preventDefault();
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (_) {}
  // 清除本地状态（所有站点的状态 key，含旧版单一 key）
  Object.keys(localStorage)
    .filter(function (k) { return k.indexOf('c_knowledge_base_state') === 0; })
    .forEach(function (k) { localStorage.removeItem(k); });
  localStorage.removeItem('c_study_records');
  localStorage.removeItem('CHECKIN_STORAGE_KEY');
  // 登出 → 回登录页
  window.location.replace('/');
}

// ==================== 账号信息填充 ====================
function populateSettingsAccountInfo(me) {
    const user = (me && me.user) || {};
    const displayNameEl = document.getElementById('settingsDisplayName');
    const usernameEl = document.getElementById('settingsAccountUsername');
    const emailEl = document.getElementById('settingsAccountEmail');
    const siteEl = document.getElementById('settingsAccountSite');
    const avatarImg = document.getElementById('settingsAccountAvatar');
    const avatarFallback = document.getElementById('settingsAccountAvatarFallback');

    if (displayNameEl) displayNameEl.textContent = user.displayName || user.username || '未知';

    if (usernameEl) {
        usernameEl.innerHTML = '<i class="fas fa-user-circle"></i> ' + (user.username || '');
    }
    if (emailEl) {
        const email = user.email || '';
        emailEl.innerHTML = '<i class="fas fa-envelope"></i> ' + email;
    }
    if (siteEl && me && me.sites) {
        const currentSite = me.sites.find(function (s) { return s.key === me.site; });
        siteEl.innerHTML = '<i class="fas fa-globe"></i> ' + (currentSite ? currentSite.name : me.site);
    }

    // 头像
    if (user.avatar && avatarImg) {
        avatarImg.src = user.avatar;
        avatarImg.style.display = '';
        if (avatarFallback) avatarFallback.style.display = 'none';
    } else if (avatarFallback) {
        avatarFallback.style.display = '';
        if (avatarImg) avatarImg.style.display = 'none';
    }

    // 快捷按钮绑定
    const openEditBtn = document.getElementById('openEditProfileBtn');
    const quickPwdBtn = document.getElementById('quickChangePwdBtn');
    const quickExportBtn = document.getElementById('quickExportBtn');
    const quickImportBtn = document.getElementById('quickImportBtn');

    if (openEditBtn) {
        openEditBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // 复用 editProfileModal
            var modal = document.getElementById('editProfileModal');
            if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                var m = new bootstrap.Modal(modal);
                m.show();
            }
        });
    }
    if (quickPwdBtn) {
        quickPwdBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var modal = document.getElementById('changePasswordModal');
            if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                var m = new bootstrap.Modal(modal);
                m.show();
            }
        });
    }
    if (quickExportBtn) {
        quickExportBtn.addEventListener('click', function () {
            var btn = document.getElementById('exportAllDataBtn');
            if (btn) btn.click();
        });
    }
    if (quickImportBtn) {
        quickImportBtn.addEventListener('click', function () {
            var btn = document.getElementById('importDataBtn');
            if (btn) btn.click();
        });
    }
}

// ==================== /app 引导 ====================
function initAuth() {
  // 应用前先应用深色偏好（扫描任意站点的状态 key，兼容旧版单一 key）
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('c_knowledge_base_state') === 0) {
        const saved = JSON.parse(localStorage.getItem(k));
        if (saved && saved.darkMode) { document.body.classList.add('dark'); break; }
      }
    }
  } catch (_) {}

  fetch('/api/auth/me')
    .then(function (res) {
      if (res.ok) {
        return res.json();
      }
      throw new Error('未登录');
    })
    .then(function (me) {
      window.__currentUser = me;
      // 下拉用户信息块
      renderDropdownUser();
      // 填充设置页账号信息
      populateSettingsAccountInfo(me);
      // 站点切换下拉绑定
      bindSiteSwitcher();
      // 获取 CSRF token
      fetch('/api/csrf-token')
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d.csrfToken) sessionStorage.setItem('csrfToken', d.csrfToken); })
        .catch(function () {});
      // 已登录但尚未选定站点（多站点账号）：服务端 /app 已允许进入（不强制选站），回登录页选站
      if (me.hasSite === false || !me.site) {
        if (me.sites && me.sites.length > 1) {
          window.location.replace('/');
          return;
        }
        // 单站点理论上服务端已自动选定，若仍未选则尝试进入
        if (me.sites && me.sites.length === 1) {
          selectSite(me.sites[0].key);
          return;
        }
      }
      // 应用站点数据（章节/语录/目标）
      if (typeof setSite === 'function') setSite(me.site || 'c');
      // 背单词功能仅限英语语法站点（可见性由 data-feature=vocabulary 控制）
      var vocabEl = document.getElementById('vocabNavItem');
      if (vocabEl) vocabEl.href = '/vocabulary.html?site=' + (me.site || 'c');
      // 应用站点标题/副标题/主题
      applySiteConfig(me);
      // 启动应用
      if (typeof init === 'function') init();
    })
    .catch(function () {
      // 未登录 / 会话过期 → 回登录页
      if (window.location.pathname !== '/') {
        window.location.replace('/');
      }
    });
}

// ==================== 修改密码弹窗 ====================
function initChangePassword() {
  const btn = document.getElementById('changePasswordBtn');
  const modal = document.getElementById('changePasswordModal');
  const saveBtn = document.getElementById('savePasswordBtn');
  const currentPw = document.getElementById('currentPassword');
  const newPw = document.getElementById('newPassword');
  const confirmPw = document.getElementById('confirmNewPassword');
  const errorEl = document.getElementById('changePasswordError');
  if (!modal || !btn) return;

  function openModal(e) {
    if (e) e.preventDefault();
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('show');
    currentPw.value = '';
    newPw.value = '';
    confirmPw.value = '';
    errorEl.textContent = '';
    if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const instance = bootstrap.Modal.getInstance(modal);
      if (instance) instance.show();
      else new bootstrap.Modal(modal).show();
    } else if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
    }
  }

  if (btn) btn.addEventListener('click', openModal);

  saveBtn.addEventListener('click', async function () {
    const cur = currentPw.value;
    const ne = newPw.value;
    const conf = confirmPw.value;
    if (!cur || !ne || !conf) {
      errorEl.textContent = '请填写完整信息';
      return;
    }
    if (ne.length < 6) {
      errorEl.textContent = '新密码至少6位';
      return;
    }
    if (ne !== conf) {
      errorEl.textContent = '两次新密码不一致';
      return;
    }
    errorEl.textContent = '';
    saveBtn.disabled = true;
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cur, newPassword: ne }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        // 关闭弹窗
        const instance = bootstrap && bootstrap.Modal && modal && bootstrap.Modal.getInstance(modal);
        if (instance) instance.hide();
        else if (modal) { modal.classList.remove('show'); modal.style.display = 'none'; }
        // 提示成功
        if (typeof showToast === 'function') showToast('密码修改成功');
      } else {
        errorEl.textContent = data.error || '修改失败';
      }
    } catch (_) {
      errorEl.textContent = '网络错误，请重试';
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ==================== 修改资料弹窗 ====================
function initProfileEditor() {
  const btn = document.getElementById('editProfileBtn');
  const btn2 = document.getElementById('editProfileBtn2');
  const modal = document.getElementById('editProfileModal');
  const saveBtn = document.getElementById('editProfileSaveBtn');
  const nameInput = document.getElementById('editDisplayName');
  const avatarInput = document.getElementById('editAvatarUrl');
  const avatarFile = document.getElementById('editAvatarFile');
  const avatarFileName = document.getElementById('editAvatarFileName');
  const avatarPreview = document.getElementById('editAvatarPreview');
  const errorEl = document.getElementById('editProfileError');
  if (!modal) return;

  let uploadedAvatarUrl = ''; // 存储上传后的头像URL

  // 通用打开模态框函数
  function openProfileModal(e) {
    if (e) {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    // 关闭下拉菜单
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('show');
    const me = window.__currentUser;
    const user = (me && me.user) || {};
    nameInput.value = user.displayName || '';
    avatarInput.value = user.avatar || '';
    uploadedAvatarUrl = ''; // 重置上传头像
    if (avatarFileName) avatarFileName.textContent = '';
    if (avatarFile) avatarFile.value = '';
    if (user.avatar && user.avatar.trim()) {
      avatarPreview.src = user.avatar;
    } else {
      avatarPreview.src = '/image/admin-avatar.png';
    }
    errorEl.textContent = '';
    // 显示模态框
    if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.show();
      } else {
        const modalEl = new bootstrap.Modal(modal);
        modalEl.show();
      }
    } else if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
    }
  }

  // 绑定下拉菜单的按钮
  if (btn) {
    btn.addEventListener('click', openProfileModal);
  }
  // 绑定设置页面的按钮
  if (btn2) {
    btn2.addEventListener('click', openProfileModal);
  }

  // 如果没有任何按钮，直接返回
  if (!btn && !btn2) return;

  // 头像文件选择时预览
  if (avatarFile) {
    avatarFile.addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        // 显示文件名
        if (avatarFileName) avatarFileName.textContent = file.name;
        // 预览图片
        const reader = new FileReader();
        reader.onload = function (ev) {
          avatarPreview.src = ev.target.result;
          uploadedAvatarUrl = ev.target.result; // 存储base64
        };
        reader.readAsDataURL(file);
        // 清空URL输入
        if (avatarInput) avatarInput.value = '';
      }
    });
  }

  // 头像 URL 输入时实时预览
  if (avatarInput) {
    avatarInput.addEventListener('input', function () {
      const url = avatarInput.value.trim();
      if (url) {
        avatarPreview.src = url;
        uploadedAvatarUrl = ''; // URL模式下清空上传的base64
        if (avatarFileName) avatarFileName.textContent = '';
      } else {
        avatarPreview.src = '/image/admin-avatar.png';
      }
    });
  }

  saveBtn.addEventListener('click', async function () {
    const displayName = nameInput.value.trim();
    const avatarUrl = avatarInput.value.trim();
    if (!displayName) {
      errorEl.textContent = '显示名称不能为空';
      return;
    }
    errorEl.textContent = '';
    saveBtn.disabled = true;
    try {
      // 如果有上传的图片，使用base64；否则使用URL
      const avatar = uploadedAvatarUrl || avatarUrl;
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatar }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (window.__currentUser && window.__currentUser.user) {
          window.__currentUser.user.displayName = data.user.displayName;
          window.__currentUser.user.avatar = data.user.avatar;
        }
        renderDropdownUser();
        // 关闭弹窗
        const modalInstance = bootstrap && bootstrap.Modal && modal && bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
          modalInstance.hide();
        } else if (modal) {
          modal.classList.remove('show');
          modal.style.display = 'none';
        }
      } else {
        errorEl.textContent = data.error || '保存失败';
      }
    } catch (_) {
      errorEl.textContent = '网络错误，请重试';
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ==================== 用户下拉菜单手动控制 ====================
function initUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  const btn = document.getElementById('userDropdownBtn');
  const menu = document.getElementById('userDropdownMenu');

  if (!dropdown || !btn || !menu) return;

  // 点击按钮切换下拉
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = menu.classList.contains('show');
    // 关闭所有 Bootstrap 下拉
    document.querySelectorAll('.dropdown-menu.show').forEach(function (d) {
      d.classList.remove('show');
    });
    if (!isOpen) {
      menu.classList.add('show');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      menu.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // 点击其他地方关闭
  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target)) {
      menu.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // 站点切换项使用 Bootstrap 下拉的，需要阻止冒泡
  const siteItems = menu.querySelectorAll('#siteSwitchDropdown .dropdown-item');
  siteItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  });

  // 退出登录
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      handleLogout();
    });
  }
}

document.addEventListener('DOMContentLoaded', initAuth);
document.addEventListener('DOMContentLoaded', initProfileEditor);
document.addEventListener('DOMContentLoaded', initUserDropdown);
document.addEventListener('DOMContentLoaded', initChangePassword);
