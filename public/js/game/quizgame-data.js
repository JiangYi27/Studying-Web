/* =============================================================
 * quizgame-data.js —— 实战闯关游戏配置（接入主站后适配版）
 *
 * 说明：章节(CHAPTERS)与题库(QUIZZES)由主站 chapters.js 提供
 * （按站点切换、从 /api/quizzes 加载）；本文件提供游戏常量与
 * 14 重试炼的关卡元数据（名称 / 图标 / 寓意）。
 * ============================================================= */
(function(){
  'use strict';

  // 优先使用 QuizConfig（配置中心），兜底用默认值
  const _cfg = window.QuizConfig || {};

  const CONFIG = {
    EXP_PER_LEVEL:       _cfg.EXP_PER_LEVEL       || 100,
    BATTLE_SECONDS:      _cfg.BATTLE_SECONDS      || 25,
    QUIZ_COUNT:          _cfg.QUIZ_COUNT          || 8,
    PASS_RATE:           _cfg.PASS_RATE           || 0.6,
    XP_PER_CORRECT:      _cfg.XP_PER_CORRECT      || 10,
    SCROLL_SENSITIVITY:  _cfg.SCROLL_SENSITIVITY  || 0.0014,
    MIN_SCALE:           _cfg.MIN_SCALE           || 0.6,
    MAX_SCALE:           _cfg.MAX_SCALE           || 2.5,
  };

  /* ===================== 关卡秘典 · 14 重试炼命名 =====================
   * 与主站 CHAPTERS 一一对应（C 语言站 14 章）。
   * name  关卡名；emoji 图标；motto 寓意（提示/详情展示）。
   */
  const LEVEL_META = [
    { name: '初心木屋', emoji: '🏠', motto: '远征的起点，求知最初的温暖与安定。' },
    { name: '幽谷飞瀑', emoji: '💧', motto: '基础如流水般持续渗透，入门试炼。' },
    { name: '智慧古树', emoji: '🌳', motto: '知识的根系深扎于此，第一阶段的扎根考验。' },
    { name: '翠绿迷阵', emoji: '🧩', motto: '路径曲折而复杂，逻辑推理的初级试炼。' },
    { name: '巨石峰峦', emoji: '🪨', motto: '前进路上的第一座高山，需要扎实功底突破。' },
    { name: '荒兽领地', emoji: '🦏', motto: '具象化的难题，需要调用所学知识应对。' },
    { name: '霜晶守卫', emoji: '❄️', motto: '冰冷的逻辑考验，绝对理性的第一道关卡。' },
    { name: '深渊熔炉', emoji: '💀', motto: '复杂知识的深潭，压力与淬炼并存。' },
    { name: '玄冰王座', emoji: '🔷', motto: '冰冷结构的极致，系统性与结构的巅峰。' },
    { name: '紫晶圣域', emoji: '🔮', motto: '神秘深邃的魔法领域，与紫水晶圣域呼应。' },
    { name: '黄金沙塔', emoji: '🏜️', motto: '需要耐心与时间破解的古老遗迹。' },
    { name: '赤焰熔炉', emoji: '🔥', motto: '炽热的考验，需要知识、专注与冷静。' },
    { name: '深邃之眼', emoji: '🌪️', motto: '打破思维惯性，跨越维度的创新挑战。' },
    { name: '终焉古颅', emoji: '💀', motto: '知识远征的终点，跨越高度的综合挑战！' },
  ];

  window.CONFIG = CONFIG;
  window.LEVEL_META = LEVEL_META;
})();
