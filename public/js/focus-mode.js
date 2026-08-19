/* ==================== 专注模式 — loc.html 原版实现 ==================== */
(function () {
  'use strict';

  var overlay, clock, timerInterval, countdownSeconds = 25 * 60, isRunning = false;

  function loadDeps() {
    return new Promise(function(resolve) {
      if (window.jQuery && window.jQuery.fn.FlipClock) { resolve(); return; }
      var jq = document.createElement('script');
      jq.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js';
      document.head.appendChild(jq);
      jq.onload = function() {
        var fc = document.createElement('script');
        fc.src = 'https://cdnjs.cloudflare.com/ajax/libs/flipclock/0.7.8/flipclock.min.js';
        document.head.appendChild(fc);
        fc.onload = resolve;
      };
    });
  }

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'focus-overlay';
    overlay.innerHTML =
      '<div class="container">' +
        '<div class="main-title">⏳ 专注时钟</div>' +
        '<div class="clock-scale"><div class="clock flip-clock-wrapper" id="flipclock"></div></div>' +
        '<div class="quote">"<em>专注当下，成就未来</em>"</div>' +
        '<div class="control-panel">' +
          '<div class="countdown-display" id="countdownDisplay">25:00 <span class="unit">分钟</span></div>' +
          '<div class="control-group">' +
            '<button class="btn btn-icon" id="btnMinus">−</button>' +
            '<input type="number" class="control-input" id="minutesInput" value="25" min="1" max="60" />' +
            '<button class="btn btn-icon" id="btnPlus">+</button>' +
            '<span class="control-label" style="margin-left:4px;">分钟</span>' +
          '</div>' +
          '<div class="control-group">' +
            '<button class="btn btn-primary" id="btnStartPause">开始</button>' +
            '<button class="btn btn-danger" id="btnReset">重置</button>' +
          '</div>' +
        '</div>' +
        '<div class="fullscreen-wrap">' +
          '<button class="btn-fullscreen" id="fullscreenButton">⛶ 全屏</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // 初始化 FlipClock
    clock = $('#flipclock').FlipClock({
      clockFace: 'TwentyFourHourClock',
      showSeconds: true,
      language: 'chinese'
    });

    // 事件绑定
    document.getElementById('btnStartPause').addEventListener('click', toggleTimer);
    document.getElementById('btnReset').addEventListener('click', resetTimer);
    document.getElementById('btnMinus').addEventListener('click', minusTimer);
    document.getElementById('btnPlus').addEventListener('click', plusTimer);
    document.getElementById('minutesInput').addEventListener('change', syncFromInput);
    document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);

    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    // ESC关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('show')) close();
    });

    updateCountdownDisplay(countdownSeconds);
  }

  function open() {
    loadDeps().then(function() {
      createOverlay();
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('show');
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    isRunning = false;
    document.body.style.overflow = '';
  }

  function toggle() {
    if (overlay && overlay.classList.contains('show')) close();
    else open();
  }

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
    display.innerHTML = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0') + ' <span class="unit">分钟</span>';
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
    var btn = document.getElementById('focusModeBtn');
    if (btn) btn.addEventListener('click', function(e) { e.preventDefault(); toggle(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindButton);
  } else {
    bindButton();
  }

  window.FocusMode = { open: open, close: close, toggle: toggle };
})();
