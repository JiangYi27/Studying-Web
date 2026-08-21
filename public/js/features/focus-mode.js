/* ==================== 专注模式 — loc.html 视觉 · 纯JS实现 ==================== */
(function () {
  'use strict';

  var overlay, timerInterval, countdownSeconds = 25 * 60, isRunning = false;
  var clockInterval = null;
  var prevDigits = { h: '--', m: '--', s: '--' };

  // 随机金句
  var quotes = [
    { text: '专注当下，成就未来', highlight: '专注' },
    { text: '每一次专注都是成长的积累', highlight: '专注' },
    { text: '静下心来，世界会为你让路', highlight: '静心' },
    { text: '坚持的力量，源于每一刻的专注', highlight: '坚持' },
    { text: '心无旁骛，方能致远', highlight: '心无旁骛' },
    { text: '专注是通往卓越的唯一路径', highlight: '专注' },
    { text: '把时间投入在重要的事情上', highlight: '时间' },
    { text: '深度工作，创造价值', highlight: '深度' }
  ];

  function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  function createOverlay() {
    if (overlay) return;
    var quote = getRandomQuote();
    overlay = document.createElement('div');
    overlay.className = 'focus-overlay';
    overlay.innerHTML =
      '<div class="focus-home-btn" id="focusHomeBtn" title="返回主页"><i class="fas fa-home"></i></div>' +
      '<div class="container">' +
        '<div class="main-title">⏱ 专注时钟</div>' +
        '<div class="clock-scale"><div class="focus-flip-clock" id="focusClock"></div></div>' +
        '<div class="quote">"' + quote.text.replace(quote.highlight, '<em>' + quote.highlight + '</em>') + '"</div>' +
        '<div class="control-panel">' +
          '<div class="countdown-display" id="countdownDisplay">25<span class="unit">:</span>00</div>' +
          '<div class="control-group">' +
            '<button class="btn btn-icon" id="btnMinus">−</button>' +
            '<input type="number" class="control-input" id="minutesInput" value="25" min="1" max="60" />' +
            '<button class="btn btn-icon" id="btnPlus">+</button>' +
          '</div>' +
          '<div class="control-group">' +
            '<button class="btn btn-primary" id="btnStartPause">▶ 开始</button>' +
            '<button class="btn btn-danger" id="btnReset">↺ 重置</button>' +
          '</div>' +
        '</div>' +
        '<div class="fullscreen-wrap">' +
          '<button class="btn-fullscreen" id="fullscreenButton">⛶ 全屏专注</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // 事件绑定
    document.getElementById('btnStartPause').addEventListener('click', toggleTimer);
    document.getElementById('btnReset').addEventListener('click', resetTimer);
    document.getElementById('btnMinus').addEventListener('click', minusTimer);
    document.getElementById('btnPlus').addEventListener('click', plusTimer);
    document.getElementById('minutesInput').addEventListener('change', syncFromInput);
    document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);

    // 返回主页
    var homeBtn = document.getElementById('focusHomeBtn');
    if (homeBtn) homeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // 直接跳转，不先 close()，避免跳转前原页面闪现
      window.location.href = '/';
    });

    // 注意：不绑定"点击空白退出"——避免误触退出专注模式

    // ESC关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('show')) close();
    });

    updateCountdownDisplay(countdownSeconds);
  }

  // ===== 翻页时钟（自研，上/下半切分同一数字，仅变化时翻页） =====
  function digitHtml(d) {
    return '<div class="focus-digit" data-d="' + d + '">' +
      '<div class="focus-half top"><span class="focus-num">' + d + '</span></div>' +
      '<div class="focus-half bottom"><span class="focus-num">' + d + '</span></div>' +
      '</div>';
  }

  function colonHtml() {
    return '<span class="focus-colon"></span>';
  }

  function pairHtml(str) {
    return '<span class="focus-flip-group">' + digitHtml(str[0]) + digitHtml(str[1]) + '</span>';
  }

  function renderClockFace() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    var wrap = document.getElementById('focusClock');
    if (!wrap) return;
    wrap.innerHTML = pairHtml(h) + colonHtml() + pairHtml(m) + colonHtml() + pairHtml(s);
    prevDigits = { h: h, m: m, s: s };
  }

  // 仅当数字变化时，在对应位子上生成翻页动画层（标准FlipClock双翻页层）
  function animateFlip(pos, newVal) {
    var wrap = document.getElementById('focusClock');
    if (!wrap) return;
    var digits = wrap.querySelectorAll('.focus-digit');
    if (!digits[pos]) return;
    var digit = digits[pos];

    var halfTop = digit.querySelector('.focus-half.top .focus-num');
    var halfBottom = digit.querySelector('.focus-half.bottom .focus-num');
    var oldVal = digit.dataset.d;

    // 上半翻页层：旧值（0° → -90°），立即翻下
    var flapTop = document.createElement('div');
    flapTop.className = 'focus-flap top flipping-top';
    flapTop.innerHTML = '<span class="focus-num">' + oldVal + '</span>';
    digit.appendChild(flapTop);

    // 下半翻页层：新值（90° → 0°，延迟 0.25s 等上半翻完）
    var flapBottom = document.createElement('div');
    flapBottom.className = 'focus-flap bottom flipping-bottom';
    flapBottom.innerHTML = '<span class="focus-num">' + newVal + '</span>';
    digit.appendChild(flapBottom);

    // 动画一开始就把上半静态格更新为新值：
    // 上半翻页层（旧值）会覆盖它，翻页层翻走后露出的即新值，无缝衔接
    if (halfTop) halfTop.textContent = newVal;

    // 动画结束（0.5s）后：下半静态格更新为新值、清理翻页层
    setTimeout(function() {
      if (halfBottom) halfBottom.textContent = newVal;
      if (flapTop.parentNode) flapTop.parentNode.removeChild(flapTop);
      if (flapBottom.parentNode) flapBottom.parentNode.removeChild(flapBottom);
      digit.dataset.d = newVal;
    }, 600);
  }

  function updateClock() {
    var wrap = document.getElementById('focusClock');
    if (!wrap) return;
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');

    // 秒位（4,5）
    if (s[0] !== prevDigits.s[0]) animateFlip(4, s[0]);
    if (s[1] !== prevDigits.s[1]) animateFlip(5, s[1]);
    // 分位（2,3）
    if (m[0] !== prevDigits.m[0]) animateFlip(2, m[0]);
    if (m[1] !== prevDigits.m[1]) animateFlip(3, m[1]);
    // 时位（0,1）
    if (h[0] !== prevDigits.h[0]) animateFlip(0, h[0]);
    if (h[1] !== prevDigits.h[1]) animateFlip(1, h[1]);

    prevDigits = { h: h, m: m, s: s };
  }

  function startClock() {
    renderClockFace();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
  }

  function stopClock() {
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
  }

  // ===== 打开/关闭 =====
  function open() {
    createOverlay();
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    startClock();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('show');
    stopClock();
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    isRunning = false;
    document.body.style.overflow = '';
  }

  function toggle() {
    if (overlay && overlay.classList.contains('show')) close();
    else open();
  }

  // ===== 倒计时 =====
  function toggleTimer() {
    var btn = document.getElementById('btnStartPause');
    if (!isRunning) {
      syncFromInput();
      if (countdownSeconds <= 0) return;
      isRunning = true;
      btn.textContent = '暂停';
      btn.classList.add('btn-primary');
      document.getElementById('minutesInput').disabled = true;
      document.getElementById('btnMinus').disabled = true;
      document.getElementById('btnPlus').disabled = true;
      timerInterval = setInterval(function() {
        countdownSeconds--;
        updateCountdownDisplay(countdownSeconds);
        if (countdownSeconds <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          isRunning = false;
          btn.textContent = '完成';
          btn.disabled = true;
          document.getElementById('minutesInput').disabled = false;
          document.getElementById('btnMinus').disabled = false;
          document.getElementById('btnPlus').disabled = false;
          playSound();
        }
      }, 1000);
    } else {
      pauseTimer();
    }
  }

  function pauseTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    isRunning = false;
    var btn = document.getElementById('btnStartPause');
    btn.textContent = '继续';
    document.getElementById('minutesInput').disabled = false;
    document.getElementById('btnMinus').disabled = false;
    document.getElementById('btnPlus').disabled = false;
  }

  function resetTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    isRunning = false;
    var btn = document.getElementById('btnStartPause');
    var input = document.getElementById('minutesInput');
    var val = parseInt(input.value) || 25;
    val = Math.min(Math.max(val, 1), 60);
    input.value = val;
    countdownSeconds = val * 60;
    updateCountdownDisplay(countdownSeconds);
    btn.textContent = '开始';
    btn.disabled = false;
    btn.classList.remove('btn-primary');
    input.disabled = false;
    document.getElementById('btnMinus').disabled = false;
    document.getElementById('btnPlus').disabled = false;
  }

  function minusTimer() {
    if (isRunning) return;
    var input = document.getElementById('minutesInput');
    var val = parseInt(input.value) || 25;
    val = Math.max(val - 1, 1);
    input.value = val;
    countdownSeconds = val * 60;
    updateCountdownDisplay(countdownSeconds);
  }

  function plusTimer() {
    if (isRunning) return;
    var input = document.getElementById('minutesInput');
    var val = parseInt(input.value) || 25;
    val = Math.min(val + 1, 60);
    input.value = val;
    countdownSeconds = val * 60;
    updateCountdownDisplay(countdownSeconds);
  }

  function syncFromInput() {
    var input = document.getElementById('minutesInput');
    var val = parseInt(input.value) || 25;
    val = Math.min(Math.max(val, 1), 60);
    input.value = val;
    if (!isRunning && !timerInterval) {
      countdownSeconds = val * 60;
      updateCountdownDisplay(countdownSeconds);
    }
  }

  function updateCountdownDisplay(seconds) {
    var display = document.getElementById('countdownDisplay');
    if (!display) return;
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    display.innerHTML = '<span class="time">' + String(mins).padStart(2, '0') + '</span><span class="unit">:</span><span class="time">' + String(secs).padStart(2, '0') + '</span>';
  }

  function playSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1100].forEach(function(freq, i) {
        setTimeout(function() {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = freq; o.type = 'sine'; g.gain.value = 0.3;
          o.start(); o.stop(ctx.currentTime + 0.3);
        }, i * 400);
      });
    } catch (e) {}
    setTimeout(function() { close(); }, 3000);
  }

  function toggleFullscreen() {
    var btn = document.getElementById('fullscreenButton');
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        btn.textContent = '⛶ 退出全屏';
      } else {
        document.exitFullscreen();
        btn.textContent = '⛶ 全屏';
      }
    } catch (e) {}
  }
  document.addEventListener('fullscreenchange', function() {
    var btn = document.getElementById('fullscreenButton');
    if (btn) btn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
  });

  function bindButton() {
    var btn = document.getElementById('focusClockBtn');
    if (btn) btn.addEventListener('click', function(e) { e.preventDefault(); toggle(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindButton);
  } else {
    bindButton();
  }

  window.FocusMode = { open: open, close: close, toggle: toggle };
})();
