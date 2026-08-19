/* ==================== 登录页：视频 Hero + 登录卡 ==================== */
(function () {
  'use strict';

  var overlay = document.getElementById('loginBg');
  if (!overlay) return;

  /* ─── 视频切换 ─── */
  var videos = Array.prototype.slice.call(document.querySelectorAll('.login-hero-video'));
  var vtabs = Array.prototype.slice.call(document.querySelectorAll('.login-hero-vtab'));
  var heroBody = document.getElementById('loginHeroBody');
  var heroPage = document.getElementById('loginHeroPage');
  var authPage = document.getElementById('loginAuthPage');
  var menuBtn = document.getElementById('loginMenuBtn');
  var menuOverlay = document.getElementById('loginMenuOverlay');
  if (!videos.length || !vtabs.length) return;

  var activeVideo = 0;
  var videoTransitioning = false;

  function activateVideo(i) {
    if (i === activeVideo || videoTransitioning || i < 0 || i >= videos.length) return;
    videoTransitioning = true;

    // 暂停当前视频
    videos[activeVideo].pause();

    // 切换到新视频
    videos[activeVideo].classList.remove('active');
    videos[i].classList.add('active');
    vtabs[activeVideo].classList.remove('active');
    vtabs[i].classList.add('active');

    // 播放新视频
    videos[i].play().catch(function() {});

    if (heroBody) overlay.classList.toggle('dark-mode', i === 2);
    activeVideo = i;
    setTimeout(function () { videoTransitioning = false; }, 1000);
  }
  vtabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateVideo(parseInt(tab.getAttribute('data-index'), 10));
    });
  });

  /* ─── Hero / 登录卡 切换 ─── */
  function showAuth() {
    if (!authPage || !heroPage) return;
    heroPage.classList.add('auth-hidden');
    authPage.classList.remove('auth-hidden');
    showCard('login');
    var u = document.getElementById('loginUsername');
    if (u) setTimeout(function () { u.focus(); }, 80);
  }
  function showHero() {
    if (!authPage || !heroPage) return;
    authPage.classList.add('auth-hidden');
    heroPage.classList.remove('auth-hidden');
  }

  /* ─── 登录/注册/忘记密码 Tab 切换 ─── */
  var tabs = document.querySelectorAll('.tab');
  var forms = document.querySelectorAll('.form');
  var authTitle = document.getElementById('authTitle');
  var authSubtitle = document.getElementById('authSubtitle');

  function showCard(name) {
    tabs.forEach(function (t) {
      var isActive = t.dataset.form === name && name !== 'forgot';
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    forms.forEach(function (f) {
      f.classList.toggle('active', f.id === name + 'Form');
    });
    if (name === 'forgot') {
      // 忘记密码时隐藏 tabs
      tabs.forEach(function (t) { t.classList.remove('active'); });
      authTitle.textContent = '忘记密码';
      authSubtitle.textContent = '输入注册邮箱，我们将发送重置链接。';
    } else if (name === 'register') {
      authTitle.textContent = '开始学习';
      authSubtitle.textContent = '创建账号，解锁全部学习站点。';
    } else {
      authTitle.textContent = '欢迎回来';
      authSubtitle.textContent = '继续你的学习进度。';
    }
  }

  // 点"开始学习" → 切换到登录卡
  overlay.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open-login]');
    if (opener) {
      e.preventDefault();
      if (menuBtn && menuOverlay) {
        menuBtn.classList.remove('open');
        menuOverlay.classList.remove('open');
      }
      showAuth();
      return;
    }
    // Tab 切换
    var tabEl = e.target.closest('[data-form]');
    if (tabEl && tabEl.classList.contains('tab')) {
      showCard(tabEl.dataset.form);
    }
    // 邮箱登录/注册按钮（social buttons 上的 data-form 也在这里处理）
    var socialEl = e.target.closest('button.social[data-form]');
    if (socialEl) {
      showCard(socialEl.dataset.form);
    }
  });

  // 返回首页
  var backBtn = document.getElementById('loginBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      showHero();
    });
  }

  /* ─── 移动端汉堡菜单 ─── */
  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.classList.toggle('open');
      menuOverlay.classList.toggle('open', open);
    });
    menuOverlay.addEventListener('click', function (e) {
      if (e.target === menuOverlay) {
        menuBtn.classList.remove('open');
        menuOverlay.classList.remove('open');
      }
    });
    menuOverlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menuBtn.classList.remove('open');
        menuOverlay.classList.remove('open');
      });
    });
  }

  /* ─── 密码显示/隐藏 ─── */
  document.querySelectorAll('.toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input');
      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-label', isPassword ? '隐藏密码' : '显示密码');
    });
  });

  /* ─── 工具 ─── */
  function getSelectedSite() {
    var sel = document.getElementById('loginSite');
    return sel ? sel.value : 'c';
  }

  function setNotice(id, msg) {
    var el = document.getElementById(id);
    if (el) { el.textContent = msg || ''; el.className = msg ? 'notice error' : 'notice'; }
  }

  function setNoticeSuccess(id, msg) {
    var el = document.getElementById(id);
    if (el) { el.textContent = msg || ''; el.className = msg ? 'notice success' : 'notice'; }
  }

  function afterAuth(data) {
    var loader = document.getElementById('loginLoaderOverlay');
    if (loader) loader.classList.add('visible');
    // 直接跳转，不等待 CSRF token（app 页面会在 initAuth 中获取）
    var redirectTo = (data && data.isAdmin) ? '/admin/index.html' : '/app';
    setTimeout(function () { window.location.assign(redirectTo); }, 300);
  }

  /* ─── 登录 ─── */
  var loginForm = document.getElementById('loginForm');
  var loginBtn = document.getElementById('loginBtn');

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;
    var site = getSelectedSite();
    var remember = document.querySelector('#loginForm .check input[type="checkbox"]');
    var rememberMe = remember ? remember.checked : false;

    if (!username || !password) { setNotice('loginNotice', '请输入账号和密码'); return; }
    setNotice('loginNotice', '');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/auth/login', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-arrow-right"></i> 进入学习空间';
        if (xhr.status === 200) {
          var data = {};
          try { data = JSON.parse(xhr.responseText); } catch (_) {}
          if (data.success) { afterAuth(data); return; }
          setNotice('loginNotice', data.error || '账号或密码错误');
        } else {
          setNotice('loginNotice', '账号或密码错误');
        }
      }
    };
    xhr.onerror = function () {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-arrow-right"></i> 进入学习空间';
      setNotice('loginNotice', '网络错误，请重试');
    };
    xhr.send(JSON.stringify({ username: username, password: password, site: site, remember: rememberMe }));
  });

  /* ─── 注册 ─── */
  var registerForm = document.getElementById('registerForm');
  var registerBtn = document.getElementById('registerBtn');

  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var username = document.getElementById('regUsername').value.trim();
    var displayName = document.getElementById('regDisplayName').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;
    var confirm = document.getElementById('regConfirm').value;

    if (!username) { setNotice('registerNotice', '请输入账号'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice('registerNotice', '请输入有效的邮箱地址');
      return;
    }
    if (password.length < 6) { setNotice('registerNotice', '密码至少 6 位'); return; }
    if (password !== confirm) { setNotice('registerNotice', '两次密码不一致'); return; }
    setNotice('registerNotice', '');
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/auth/register', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> 创建我的账号';
        if (xhr.status === 200) {
          var data = {};
          try { data = JSON.parse(xhr.responseText); } catch (_) {}
          if (data.success) {
            // 注册成功，切换到登录 Tab，让用户手动登录
            setNoticeSuccess('registerNotice', '注册成功！请登录');
            showCard('login');
            // 预填用户名，方便用户直接输入密码登录
            var loginUserInput = document.getElementById('loginUsername');
            if (loginUserInput) {
              loginUserInput.value = username;
              var loginPwInput = document.getElementById('loginPassword');
              if (loginPwInput) setTimeout(function () { loginPwInput.focus(); }, 100);
            }
            return;
          }
          setNotice('registerNotice', data.error || '注册失败，请重试');
        } else {
          setNotice('registerNotice', '注册失败，请重试');
        }
      }
    };
    xhr.onerror = function () {
      registerBtn.disabled = false;
      registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> 创建我的账号';
      setNotice('registerNotice', '网络错误，请重试');
    };
    xhr.send(JSON.stringify({ username: username, password: password, email: email, displayName: displayName }));
  });

  /* ─── 忘记密码 ─── */
  var forgotPwdLink = document.getElementById('forgotPwdLink');
  var backToLogin = document.getElementById('backToLogin');
  var forgotForm = document.getElementById('forgotForm');
  var forgotBtn = document.getElementById('forgotBtn');

  if (forgotPwdLink) {
    forgotPwdLink.addEventListener('click', function (e) {
      e.preventDefault();
      showCard('forgot');
    });
  }

  if (backToLogin) {
    backToLogin.addEventListener('click', function (e) {
      e.preventDefault();
      showCard('login');
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('forgotEmail').value.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setNotice('forgotNotice', '请输入有效的邮箱地址');
        return;
      }
      setNotice('forgotNotice', '');
      forgotBtn.disabled = true;
      forgotBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/auth/forgot-password', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          forgotBtn.disabled = false;
          forgotBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发送重置链接';
          if (xhr.status === 200) {
            var data = {};
            try { data = JSON.parse(xhr.responseText); } catch (_) {}
            setNoticeSuccess('forgotNotice', data.message || '如果该邮箱已注册，重置链接将发送到您的邮箱');
          } else {
            setNotice('forgotNotice', '发送失败，请稍后重试');
          }
        }
      };
      xhr.onerror = function () {
        forgotBtn.disabled = false;
        forgotBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发送重置链接';
        setNotice('forgotNotice', '网络错误，请重试');
      };
      xhr.send(JSON.stringify({ email: email }));
    });
  }
})();