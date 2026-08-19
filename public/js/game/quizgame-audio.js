/* =============================================================
 * audio.js —— Web Audio 合成音效（无音频文件依赖）
 * 用 OscillatorNode + GainNode 实时合成各类游戏音效。
 * ============================================================= */
(function(){
  'use strict';

  let ctx = null;
  let masterGain = null;
  let enabled = true;

  // 从 localStorage 读取开关
  try {
    enabled = localStorage.getItem('c_sound_enabled') !== '0';
  } catch (e) {}

  function ensure(){
    if (ctx) return true;
    if (!enabled) return false;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  // 需在用户手势中调用以解锁 AudioContext
  function unlock(){
    if (!enabled) return;
    ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(()=>{});
  }

  // 核心：播放一串音调
  function tone(freq, dur, type, vol, delay){
    if (!ensure() || !ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  // 频率滑音
  function glide(f0, f1, dur, type, vol, delay){
    if (!ensure() || !ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol || 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  // 音效表
  const SOUNDS = {
    click(){ tone(200, 0.05, 'square', 0.2); glide(200, 80, 0.08, 'square', 0.15); },
    correct(){ glide(523, 784, 0.12, 'sine', 0.3); },
    wrong(){ glide(196, 98, 0.3, 'sawtooth', 0.3); },
    combo(){ glide(600, 1200, 0.2, 'triangle', 0.3); },
    levelup(){ glide(330, 880, 0.4, 'sawtooth', 0.35); tone(880, 0.3, 'triangle', 0.25, 0.05); },
    victory(){
      const seq = [523, 659, 784, 1047];
      seq.forEach((f,i)=> tone(f, 0.35, 'triangle', 0.35, i*0.18));
    },
    wave(){ glide(300, 600, 0.25, 'triangle', 0.3); },
    lock(){ tone(180, 0.15, 'square', 0.2); tone(120, 0.25, 'square', 0.2, 0.12); },
    kill(){ glide(500, 120, 0.25, 'sawtooth', 0.3); },
    heart(){ glide(400, 700, 0.15, 'sine', 0.3); },
    fail(){ [240, 200, 160, 120].forEach((f,i)=> tone(f, 0.3, 'sawtooth', 0.3, i*0.2)); },
    hover(){ tone(600, 0.03, 'sine', 0.12); },
  };

  window.Sound = {
    play(name){
      if (!enabled) return;
      if (!ensure()) return;
      const fn = SOUNDS[name];
      if (fn) {
        try { fn(); } catch(e){}
      }
    },
    unlock, ensure,
    isEnabled(){ return enabled; },
    toggle(){
      enabled = !enabled;
      try { localStorage.setItem('c_sound_enabled', enabled ? '1' : '0'); } catch(e){}
      return enabled;
    }
  };

})();