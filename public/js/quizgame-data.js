/* =============================================================
 * quizgame-data.js —— 实战闯关游戏配置（接入主站后适配版）
 *
 * 说明：章节(CHAPTERS)与题库(QUIZZES)由主站 chapters.js 提供
 * （按站点切换、从 /api/quizzes 加载）；本文件提供游戏常量与
 * 14 重试炼的关卡元数据（名称 / 图标 / 寓意）。
 * ============================================================= */
(function(){
  'use strict';

  const CONFIG = {
    EXP_PER_LEVEL: 100,        // 每级所需经验 = 等级 × 100
    BATTLE_SECONDS: 15,        // 每题限时
    BATTLE_LIVES: 3,           // 战斗生命
    XP_PER_CORRECT: 10,        // 每题基础经验分
    SCROLL_SENSITIVITY: 0.0014,
    MIN_SCALE: 0.6,            // 兜底下限（实际使用 Game.minScale() 动态下限）
    MAX_SCALE: 2.5,
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
    { name: '终焉古颅', emoji: '💀', motto: '知识远征的最终 BOSS，大决战！' },
  ];

  window.CONFIG = CONFIG;
  window.LEVEL_META = LEVEL_META;
})();
