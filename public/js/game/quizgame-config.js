/* =============================================================
 * quizgame-config.js —— 实战闯关全局配置中心
 *
 * 所有配置项均可在此统一调整，也支持运行时动态修改。
 * 游戏代码应优先读取 QuizConfig 而非硬编码值。
 * ============================================================= */
(function () {
  'use strict';

  const QuizConfig = {
    /* ==================== 核心游戏参数 ==================== */
    EXP_PER_LEVEL: 100,       // 每级所需经验 = 等级 × 100
    BATTLE_SECONDS: 25,       // 每题默认时限（秒），可调 5~120
    QUIZ_COUNT: 8,            // 每章默认抽取题数，可调 3~20
    PASS_RATE: 0.6,          // 通关及格线（0.0~1.0），默认 60%
    XP_PER_CORRECT: 10,      // 每题答对基础经验分

    /* ==================== 界面与交互 ==================== */
    SKIP_INTRO_VIDEO: false,  // 是否默认跳过开场视频（首次进入仍播一次）
    SKIP_LEVEL_INTRO: true,   // 是否跳过关卡秘典过渡页，直接开始答题
    SHOW_KEYBOARD_HINTS: true,// 是否在选项旁显示 A/B/C/D 快捷键提示

    /* ==================== 视觉效果 ==================== */
    PARTICLE_ENABLED: true,   // 粒子特效开关（低端设备可关闭）
    PARTICLE_COUNT: 20,       // 每次数粒数量
    RESULT_VIDEO_ENABLED: true,// 结算视频开关（关闭则直接显示结果）

    /* ==================== 题目筛选 ==================== */
    DIFFICULTY_FILTER: 'all', // 难度筛选: 'easy'(1) / 'medium'(2) / 'hard'(3) / 'all'
    ENABLE_TIMEOUT: true,      // 是否启用超时机制
    SHOW_EXPLANATION: true,    // 答完后是否显示解析

    /* ==================== 音频 ==================== */
    SOUND_ENABLED: true,      // 音效总开关
    MUSIC_ENABLED: true,      // 背景音乐开关

    /* ==================== 相机与缩放 ==================== */
    SCROLL_SENSITIVITY: 0.0014,
    MIN_SCALE: 0.6,          // 地图最小缩放
    MAX_SCALE: 2.5,          // 地图最大缩放

    /* ==================== 运行时配置 ==================== */

    // 根据当前站点动态调整配置
    applySiteOverrides: function (siteKey) {
      switch (siteKey) {
        case 'grammar':
          this.QUIZ_COUNT = 5;      // 语法站题少一点
          this.BATTLE_SECONDS = 30;  // 时间充裕一点
          this.PASS_RATE = 0.6;
          break;
        case 'vocabulary':
          this.QUIZ_COUNT = 10;
          this.BATTLE_SECONDS = 20;
          this.PASS_RATE = 0.7;
          break;
        case 'c':
        default:
          // C语言站保持默认配置
          break;
      }
    },

    // 动态更新配置（用于设置面板）
    set: function (key, value) {
      if (key in this) {
        this[key] = value;
        // 同步到 localStorage
        try {
          const saved = JSON.parse(localStorage.getItem('quiz_config') || '{}');
          saved[key] = value;
          localStorage.setItem('quiz_config', JSON.stringify(saved));
        } catch (e) {}
        return true;
      }
      return false;
    },

    // 保存全部配置到 localStorage
    save: function () {
      const data = {};
      for (const key in this) {
        if (typeof this[key] !== 'function' && !key.startsWith('_')) {
          data[key] = this[key];
        }
      }
      try {
        localStorage.setItem('quiz_config', JSON.stringify(data));
      } catch (e) {}
    },

    // 加载保存的配置
    load: function () {
      try {
        const saved = JSON.parse(localStorage.getItem('quiz_config') || '{}');
        for (const key in saved) {
          if (key in this && typeof this[key] !== 'function') {
            this[key] = saved[key];
          }
        }
      } catch (e) {}
    },

    // 获取当前配置快照（用于调试）
    snapshot: function () {
      const snap = {};
      for (const key in this) {
        if (typeof this[key] !== 'function') {
          snap[key] = this[key];
        }
      }
      return snap;
    }
  };

  // 页面加载时恢复用户保存的配置
  QuizConfig.load();

  // 暴露到全局
  window.QuizConfig = QuizConfig;

})();
