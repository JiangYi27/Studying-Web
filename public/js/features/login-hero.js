/* ==================== 登录前视频首页 + 登录界面层切换 ==================== */
/* 未登录看到完整视频首页；点「开始学习」→ 首页隐藏，显示登录界面层（视频为底 + 液态玻璃卡）。
   返回按钮 → 回首页。场景切换、移动菜单、遮罩显隐暂停恢复均保留。 */
(function () {
  'use strict';

  function initLoginHero() {
    const overlay = document.getElementById('loginOverlay');
    if (!overlay) return;
    const videos = Array.prototype.slice.call(document.querySelectorAll('#loginOverlay .login-hero-video'));
    const tabs = Array.prototype.slice.call(document.querySelectorAll('#loginOverlay .login-hero-vtab'));
    const heroBody = document.getElementById('loginHeroBody');
    const heroPage = document.getElementById('loginHeroPage');
    const authPage = document.getElementById('loginAuthPage');
    const menuBtn = document.getElementById('loginMenuBtn');
    const menuOverlay = document.getElementById('loginMenuOverlay');
    if (!videos.length || !tabs.length) return;

    let active = 0;
    let transitioning = false;

    /* ---- 场景切换（视频交叉淡入 + 深林暗色模式） ---- */
    function activate(i) {
      if (i === active || transitioning || i < 0 || i >= videos.length) return;
      transitioning = true;
      videos[active].classList.remove('active');
      videos[active].pause();
      videos[i].classList.add('active');
      const p = videos[i].play();
      if (p && p.catch) p.catch(function () {});
      tabs[active].classList.remove('active');
      tabs[i].classList.add('active');
      if (heroBody) overlay.classList.toggle('dark-mode', i === 2);
      active = i;
      setTimeout(function () { transitioning = false; }, 1000);
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activate(parseInt(tab.getAttribute('data-index'), 10));
      });
    });

    /* ---- 首页 / 登录界面层切换 ---- */
    function showAuth() {
      if (!authPage || !heroPage) return;
      heroPage.classList.add('auth-hidden');
      authPage.classList.remove('auth-hidden');
      // 重置为「登录」模式：站点选择隐藏、登录表单显示、注册表单隐藏、标题回「登 录」
      const picker = document.getElementById('loginSitePicker');
      const form = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      const title = document.querySelector('.login-title');
      const err = document.getElementById('loginError');
      const regErr = document.getElementById('registerError');
      if (picker) picker.style.display = 'none';
      if (form) form.style.display = '';
      if (registerForm) registerForm.style.display = 'none';
      if (title) title.textContent = '登 录';
      if (err) err.textContent = '';
      if (regErr) regErr.textContent = '';
      const u = document.getElementById('loginUsername');
      if (u) setTimeout(function () { u.focus(); }, 80);
    }
    function showHero() {
      if (!authPage || !heroPage) return;
      authPage.classList.add('auth-hidden');
      heroPage.classList.remove('auth-hidden');
    }

    // 任意带 data-open-login 的按钮（导航 CTA / email「开始旅程」/ 移动菜单 CTA）→ 进入登录界面
    overlay.addEventListener('click', function (e) {
      const opener = e.target.closest('[data-open-login]');
      if (opener) {
        e.preventDefault();
        // 若移动菜单开着，先关掉
        if (menuBtn && menuOverlay) {
          menuBtn.classList.remove('open');
          menuOverlay.classList.remove('open');
        }
        showAuth();
      }
    });

    // 返回首页按钮
    const backBtn = document.getElementById('loginBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showHero();
      });
    }

    /* ---- 移动端汉堡菜单 ---- */
    if (menuBtn && menuOverlay) {
      menuBtn.addEventListener('click', function () {
        const open = menuBtn.classList.toggle('open');
        menuOverlay.classList.toggle('open', open);
      });
      // 点击空白处关闭
      menuOverlay.addEventListener('click', function (e) {
        if (e.target === menuOverlay) {
          menuBtn.classList.remove('open');
          menuOverlay.classList.remove('open');
        }
      });
      // 点击链接关闭
      menuOverlay.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          menuBtn.classList.remove('open');
          menuOverlay.classList.remove('open');
        });
      });
    }

    /* ---- 遮罩显隐：隐藏时暂停视频，重显时恢复播放（不重置页面显示状态） ---- */
    // 页面是 hero 还是登录界面由 showAuth/showHero/showSitePicker 控制；
    // 这里只负责视频启停，避免 overlay 重显时误把登录界面/站点选择切回 hero。
    if (window.MutationObserver) {
      const obs = new MutationObserver(function () {
        const hidden = overlay.classList.contains('hidden');
        videos.forEach(function (v) {
          if (hidden) {
            try { v.pause(); } catch (_e) {}
          } else {
            const q = v.play();
            if (q && q.catch) q.catch(function () {});
          }
        });
      });
      obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginHero);
  } else {
    initLoginHero();
  }
})();
