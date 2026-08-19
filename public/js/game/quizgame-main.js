/* =============================================================
 * main.js —— 启动 / 入口视频 / 地图交互（拖拽·滚轮·键盘·小地图）
 * ============================================================= */
(function(){
  'use strict';
  const G = window.Game;

  // ===== main-site integration: enter/exit driven by roadmap.js switchView =====
  let gameInited = false;
  let startScreenInited = false;
  let mapInteractionBound = false;

  function enter(){
    Sound.unlock();
    if (!gameInited && G && G.init){ G.init(); gameInited = true; }
    if (!startScreenInited){ initStartScreen(); startScreenInited = true; }
    if (!mapInteractionBound){ initMapInteraction(); mapInteractionBound = true; }
    // full intro plays on every entry (user decision 5B)
    const startView = document.getElementById('startView');
    const loadingView = document.getElementById('loadingView');
    const mapView = document.getElementById('qgMapView');
    if (startView) startView.classList.add('active');
    if (loadingView) loadingView.classList.remove('active');
    if (mapView) mapView.classList.remove('active');
    if (window.__startAPI) window.__startAPI.reset();
    if (G && G.stopMapMusic) G.stopMapMusic();
  }

  function exit(){
    if (G && G.stopMapMusic) G.stopMapMusic();
    const startView = document.getElementById('startView');
    const loadingView = document.getElementById('loadingView');
    const mapView = document.getElementById('qgMapView');
    if (startView) startView.classList.remove('active');
    if (loadingView) loadingView.classList.remove('active');
    if (mapView) mapView.classList.remove('active');
    const loopVideo = document.getElementById('startLoopVideo');
    const gameVideo = document.getElementById('startGameVideo');
    const loopAudio = document.getElementById('startLoopAudio');
    if (loopVideo){ try{ loopVideo.pause(); loopVideo.hidden = true; }catch(e){} }
    if (gameVideo){ try{ gameVideo.pause(); gameVideo.hidden = true; }catch(e){} }
    if (loopAudio){ try{ loopAudio.pause(); }catch(e){} }
  }

  window.QuizGameMain = { enter: enter, exit: exit };

  /* ===================== 开场（一次性）：loop 视频 → 开门动画 =====================
   * 已移除静态标题页（「开始闯关」按钮页）。进入后直接播放 loop.mp4
   * 并常显「点击进入」提示；点击 → enter.mp4（开门动画）→ 加载 → 地图。
   */
  function initStartScreen(){
    const startView = document.getElementById('startView');
    const mapView = document.getElementById('qgMapView');
    const loadingView = document.getElementById('loadingView');
    const loopVideo = document.getElementById('startLoopVideo');
    const gameVideo = document.getElementById('startGameVideo');
    const loopAudio = document.getElementById('startLoopAudio');
    const loopHint = document.getElementById('loopHint');
    const skipBtn = document.getElementById('skipIntroBtn');
    if (!startView || !mapView || !loopVideo || !gameVideo) return;

    let phase = 'loop';           // loop → enter（一次性开场）
    let startTimer = null;        // enter 视频兜底定时器
    let loopStallTimer = null;    // loop 视频卡住兜底
    const CENTER_W = 400, CENTER_H = 600;   // 点击中央区域判定（约 400×600）

    // 供「← 返回」回到开场时重置（重播 loop）
    window.__startAPI = {
      reset(){
        phase = 'loop';
        if (startTimer){ clearTimeout(startTimer); startTimer = null; }
        if (loopStallTimer){ clearTimeout(loopStallTimer); loopStallTimer = null; }
        if (skipBtn) skipBtn.hidden = false;
        if (loopHint) loopHint.hidden = false;
        showLoopPhase();
      },
    };

    // 标题页 / loop 视频共用 loop.mp3
    function tryPlayMusic(){
      if (!loopAudio) return;
      loopAudio.play().then(() => {}).catch(() => {});
    }
    // 开门动画自带音乐：彻底停掉 loop.mp3
    function stopMusic(){
      if (!loopAudio) return;
      try {
        loopAudio.pause();
        loopAudio.currentTime = 0;
        loopAudio.volume = 1;
      } catch (e) {}
    }
    // 淡出并停止 loop 音乐（进入地图时调用）
    function fadeOutLoopAudio(){
      if (!loopAudio) return;
      try {
        const vol = loopAudio.volume;
        const step = () => {
          loopAudio.volume = Math.max(0, loopAudio.volume - 0.1);
          if (loopAudio.volume > 0){
            setTimeout(step, 50);
          } else {
            loopAudio.pause();
            loopAudio.volume = vol;
          }
        };
        step();
      } catch (e) { loopAudio.pause(); }
    }

    // loop 阶段：播放 loop 视频 + 音乐，常显「点击进入」提示
    function showLoopPhase(){
      if (phase !== 'loop') return;
      stopMusic();
      tryPlayMusic();            // 背景音乐
      loopVideo.loop = true;
      loopVideo.muted = true;
      loopVideo.hidden = false;
      loopVideo.classList.remove('show');
      loopVideo.currentTime = 0;
      loopVideo.play().catch(() => {});
      requestAnimationFrame(() => requestAnimationFrame(() => loopVideo.classList.add('show')));
      if (loopHint){ loopHint.hidden = false; }
      if (skipBtn) skipBtn.hidden = false;
      // loop 视频卡住（8 秒未开始播放）→ 自动跳过，避免黑屏
      if (loopStallTimer) clearTimeout(loopStallTimer);
      loopStallTimer = setTimeout(() => {
        loopStallTimer = null;
        if (phase === 'loop' && loopVideo.paused && loopVideo.currentTime === 0){
          skipToMap();
        }
      }, 8000);
    }

    // loop 视频：仅中央区域点击进入开门动画
    function onLoopClick(e){
      if (phase !== 'loop') return;
      const rect = startView.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (Math.abs(x - rect.width / 2) <= CENTER_W / 2 && Math.abs(y - rect.height / 2) <= CENTER_H / 2){
        startOpeningVideo();
      }
    }

    function startOpeningVideo(){
      if (phase !== 'loop') return;
      phase = 'enter';
      stopMusic();               // 开门动画自带音乐，停掉 loop.mp3
      loopVideo.pause(); loopVideo.hidden = true; loopVideo.classList.remove('show');
      if (loopHint) loopHint.hidden = true;
      if (skipBtn) skipBtn.hidden = false;
      gameVideo.muted = false;   // 播放开门动画自带音轨
      gameVideo.hidden = false;
      gameVideo.classList.remove('show');
      gameVideo.currentTime = 0;
      gameVideo.play().catch(() => {});
      requestAnimationFrame(() => requestAnimationFrame(() => gameVideo.classList.add('show')));

      gameVideo.onended = () => {
        gameVideo.hidden = true;
        if (skipBtn) skipBtn.hidden = true;
        startView.classList.remove('active');
        if (loadingView){
          loadingView.classList.add('active');
          // 加载动画 2.6s 后：淡出加载 → 淡入地图 + 慢速相机移动
          setTimeout(() => {
            if (loadingView.classList.contains('active')){
              loadingView.classList.add('fade-out');
              setTimeout(() => {
                loadingView.classList.remove('active');
                loadingView.classList.remove('fade-out');
                mapView.classList.add('active');
                mapView.classList.add('fade-in');
                fadeOutLoopAudio();
                G.onResume && G.onResume();     // 内部启动地图背景音乐 + 慢速推近
                setTimeout(() => mapView.classList.remove('fade-in'), 1400);
              }, 550);
            }
          }, 3000);
        } else {
          mapView.classList.add('active');
          mapView.classList.add('fade-in');
          fadeOutLoopAudio();
          G.onResume && G.onResume();
          setTimeout(() => mapView.classList.remove('fade-in'), 1400);
        }
      };

      // 兜底：仅当开门视频卡住（播完 +2s 仍未结束）时强制进入下一段
      const setFallback = () => {
        if (startTimer) clearTimeout(startTimer);
        const dur = isFinite(gameVideo.duration) ? gameVideo.duration : 6.7;
        startTimer = setTimeout(() => {
          if (startView.classList.contains('active') && !gameVideo.ended && (gameVideo.paused || gameVideo.readyState < 2)){
            gameVideo.onended && gameVideo.onended();
          }
        }, dur * 1000 + 2000);
      };
      if (gameVideo.readyState >= 1) setFallback();
      else gameVideo.addEventListener('loadedmetadata', setFallback, { once: true });
    }

    // 跳过开场：loop/开门阶段直接进入地图
    function skipToMap(){
      if (phase !== 'loop' && phase !== 'enter') return;
      if (startTimer){ clearTimeout(startTimer); startTimer = null; }
      if (loopStallTimer){ clearTimeout(loopStallTimer); loopStallTimer = null; }
      loopVideo.pause(); loopVideo.hidden = true; loopVideo.classList.remove('show');
      gameVideo.pause(); gameVideo.hidden = true; gameVideo.classList.remove('show');
      startView.classList.remove('active');
      if (loadingView) loadingView.classList.remove('active');
      mapView.classList.add('active');
      mapView.classList.add('fade-in');
      fadeOutLoopAudio();
      G.onResume && G.onResume();
      if (skipBtn) skipBtn.hidden = true;
      setTimeout(() => mapView.classList.remove('fade-in'), 1400);
    }
    if (skipBtn) skipBtn.addEventListener('click', skipToMap);

    showLoopPhase();   // 直接进入 loop 阶段（无标题页按钮）
    startView.addEventListener('click', onLoopClick);
    startView.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      onLoopClick({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: true });
    document.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && startView.classList.contains('active')){
        if (phase === 'loop') startOpeningVideo();
      }
    });
  }

  /* ===================== 地图交互：拖拽平移 / 滚轮缩放 / 键盘 / 小地图导航 ===================== */
  function initMapInteraction(){
    const world = document.getElementById('mapContainer');
    const minimap = document.getElementById('minimapContainer');
    const dragHint = document.getElementById('dragHint');
    if (!world || !G || !G.getS) return;

    const drag = { active:false, moved:false, px:0, py:0 };
    const pointers = new Map();
    const pinch = { active:false, d0:1, scale0:1 };
    let suppressClick = false;

    // 交互控件上不启动地图拖拽
    function isUi(e){
      return !!(e.target && e.target.closest &&
        e.target.closest('button, .battle-panel, .minimap-container, .zoom-controls, .game-hud, .game-back-btn, .map-hint'));
    }
    // 安全刷新：防 NaN + clamp + 应用变换 + 重绘小地图
    function refresh(){
      const s = G.getS();
      s.currentX = isFinite(s.currentX) ? s.currentX : 0;
      s.currentY = isFinite(s.currentY) ? s.currentY : 0;
      G.clampPos();
      G.setZoom(s.scale);
    }

    world.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (isUi(e)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2){
        const [a, b] = [...pointers.values()];
        pinch.d0 = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        pinch.scale0 = G.getS().scale;
        pinch.active = true;
        drag.active = false;
        return;
      }
      drag.active = true;
      drag.moved = false;
      drag.px = e.clientX;
      drag.py = e.clientY;
      world.classList.add('grabbing');
    });

    window.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // 双指捏合缩放
      if (pinch.active && pointers.size >= 2){
        const [a, b] = [...pointers.values()];
        const d = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        G.setZoom(pinch.scale0 * d / pinch.d0);
        e.preventDefault();
        return;
      }
      if (!drag.active) return;
      const dx = e.clientX - drag.px;
      const dy = e.clientY - drag.py;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;   // 5px 内视为点击
      drag.moved = true;
      drag.px = e.clientX;
      drag.py = e.clientY;
      const s = G.getS();
      s.currentX += dx / (s.fit * s.scale);
      s.currentY += dy / (s.fit * s.scale);
      refresh();
    });

    function endPointer(e){
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch.active = false;
      if (pointers.size === 0){
        if (drag.active){
          drag.active = false;
          world.classList.remove('grabbing');
          if (drag.moved){
            suppressClick = true;      // 拖拽结束不触发城堡点击
            if (dragHint) dragHint.classList.add('fade-out');
          }
          drag.moved = false;
        }
      } else if (drag.active && pointers.size === 1){
        const [a] = [...pointers.values()];
        drag.px = a.x; drag.py = a.y;
      }
    }
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);

    // 拖拽后抑制随后的 click（捕获阶段先于节点处理）
    world.addEventListener('click', (e) => {
      if (suppressClick){
        suppressClick = false;
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    // 滚轮缩放（以光标为中心）—— rAF 节流合并：累积滚轮步数，每帧只应用一次
    let wheelSteps = 0;
    let wheelAnchor = { x: 0, y: 0 };
    let wheelRaf = null;
    const onWheelApply = () => {
      wheelRaf = null;
      const steps = wheelSteps;
      wheelSteps = 0;
      if (steps === 0) return;
      const factor = Math.pow(1.2, steps);
      const s = G.getS();
      const before = G.screenToVB(wheelAnchor.x, wheelAnchor.y);
      G.setZoom(s.scale * factor);
      const after = G.vbToScreen(before.x, before.y);
      s.currentX += (wheelAnchor.x - after.x) / (s.fit * s.scale);
      s.currentY += (wheelAnchor.y - after.y) / (s.fit * s.scale);
      G.clampPos();
      G.setZoom(s.scale);
    };
    world.addEventListener('wheel', (e) => {
      e.preventDefault();
      wheelSteps += e.deltaY < 0 ? 1 : -1;
      wheelAnchor.x = e.clientX; wheelAnchor.y = e.clientY;
      if (wheelRaf) return;
      wheelRaf = requestAnimationFrame(onWheelApply);
    }, { passive: false });

    // 键盘平移 / 缩放
    document.addEventListener('keydown', (e) => {
      if (e.target && /^(input|textarea|select|button)$/i.test(e.target.tagName)) return;
      const panel = document.getElementById('battlePanel');
      if (panel && !panel.hidden) return;   // 战斗快捷键优先
      const startView = document.getElementById('startView');
      if (startView && startView.classList.contains('active')) return;
      const s = G.getS();
      const step = 120 / s.scale;
      let dx = 0, dy = 0;
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') dx = -step;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') dx = step;
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') dy = -step;
      else if (k === 'ArrowDown' || k === 's' || k === 'S') dy = step;
      else if (k === '+' || k === '='){ G.setZoom(s.scale * 1.2); return; }
      else if (k === '-' || k === '_'){ G.setZoom(s.scale / 1.2); return; }
      else if (k === '0'){ G.resetCamera(); return; }
      else return;
      e.preventDefault();
      s.currentX += dx;
      s.currentY += dy;
      G.clampPos();
      G.setZoom(s.scale);
    });

    // 「← 返回」：回到开始界面（关闭战斗、重播 loop 视频与音乐）
    const backBtn = document.getElementById('gameBackBtn');
    if (backBtn){
      backBtn.addEventListener('click', () => {
        const panel = document.getElementById('battlePanel');
        const closeBtn = document.getElementById('battleClose');
        if (panel && !panel.hidden && closeBtn) closeBtn.click();
        if (G && G.stopMapMusic) G.stopMapMusic();
        if (typeof switchView === 'function') switchView('home');
        else if (window.QuizGameMain) window.QuizGameMain.exit();
      });
    }

    // 小地图：点击 / 拖拽跳转
    if (minimap){
      let mmDrag = false;
      function mmPoint(e){
        const r = minimap.getBoundingClientRect();
        return {
          vx: (e.clientX - r.left) / Math.max(1, r.width) * 4508,
          vy: (e.clientY - r.top) / Math.max(1, r.height) * 2400,
        };
      }
      minimap.addEventListener('pointerdown', (e) => {
        mmDrag = true;
        const p = mmPoint(e);
        G.panTo(p.vx, p.vy);
        e.stopPropagation();
      });
      minimap.addEventListener('pointermove', (e) => {
        if (!mmDrag) return;
        const p = mmPoint(e);
        G.panTo(p.vx, p.vy);
      });
      minimap.addEventListener('pointerup', () => { mmDrag = false; });
      minimap.addEventListener('pointercancel', () => { mmDrag = false; });
    }
  }

})();
