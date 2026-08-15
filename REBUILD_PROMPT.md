# 🏰 闯关游戏重建完整提示词

> 将此文档粘贴给 AI（或自行参照），即可在任意前端项目中重建这套 RPG 技能树闯关游戏。
> 原始代码位于 `public/js/game.js`（2107 行）+ `public/css/game.css`（1758 行）+ `public/index.html` 中的 `#roadmapView` 区块（约 200 行 HTML）。

---

## 一、项目定位与技术栈

这是一个**纯前端**的 SVG 闯关游戏，没有框架依赖，仅使用：
- 原生 JavaScript（IIFE 封装）
- SVG（地图渲染）
- CSS 动画 + CSS 变量（视觉效果）
- Web Audio API（音效）
- Canvas（小地图）
- localStorage（状态持久化）

目标：在新项目中创建一个**独立的闯关游戏模块**，内容数据可配置（不限于 C 语言课程）。请先制作一个功能、视觉一模一样的版本，之后再谈优化。

---

## 二、数据结构（核心输入）

游戏需要 3 个数据源：

### 2.1 章节定义（CHAPTERS）

```javascript
// 每章一个对象，按顺序排列
const CHAPTERS = [
  {
    id: '01',              // 章节 ID（字符串，两位数）
    title: '章节标题',       // 显示名
    folder: '01_章节标题',   // 文件夹名（用于本地内容匹配）
    icon: '📖',            // 章节图标 emoji
    sections: [             // 小节文件名列表
      '01_小节一',
      '02_小节二',
      '03_小节三',
    ],
    sectionTitles: [        // 小节显示名（与 sections 一一对应）
      '小节一',
      '小节二',
      '小节三',
    ],
  },
  // ... 更多章节
];
```

**原始数据**：14 章 C 语言课程，共 57 个小节。详见 [public/js/data/chapters.js](public/js/data/chapters.js)。

### 2.2 题库（QUIZZES）

```javascript
// 格式：{ 章节ID: [题目数组] }
const QUIZZES = {
  "01": [
    {
      question: "题目文本",          // 支持特殊字符如 <stdio.h>
      options: ["选项A", "选项B", "选项C", "选项D"],  // 2~6 个选项
      answer: 0,                     // 正确选项索引（从 0 开始）
      explanation: "解析文本",        // 可选
      difficulty: 1,                 // 1=基础 2=中等 3=困难
    },
    // ...
  ],
  "02": [ /* ... */ ],
  // ...
};
```

**要点**：
- `answer` 字段是正确选项的索引（0-based）
- `difficulty` 决定战斗波次中的怪物类型
- 题目文本可能包含 HTML 尖括号（如 `<stdio.h>`），渲染时必须用 `escapeHtml` 处理

### 2.3 每章的地域主题（CASTLE_THEMES）

```javascript
// 与 CHAPTERS 一一对应，决定城堡的视觉风格
const CASTLE_THEMES = [
  { land: '村庄',      accent: '#4ade80', desc: '起点 · 新手村' },
  { land: '语法平原',  accent: '#fbbf24', desc: '基础知识' },
  { land: '流程河谷',  accent: '#38bdf8', desc: '逻辑流向' },
  { land: '数组林地',  accent: '#4ade80', desc: '数据集合' },
  { land: '函数城堡',  accent: '#f472b6', desc: '模块化' },
  { land: '指针迷宫',  accent: '#a78bfa', desc: '地址与引用' },
  { land: '内存矿井',  accent: '#fb923c', desc: '资源管理' },
  { land: '结构要塞',  accent: '#c084fc', desc: '自定义类型' },
  { land: '预处理工坊', accent: '#facc15', desc: '编译前奏' },
  { land: '标准库城',  accent: '#60a5fa', desc: '标准能力' },
  { land: '文件图书馆', accent: '#34d399', desc: '持久存储' },
  { land: '底层秘境',  accent: '#f87171', desc: '深入机器' },
  { land: '算法圣地',  accent: '#2dd4bf', desc: '结构之巅' },
  { land: '工程王城',  accent: '#fbbf24', desc: '最终试炼' },
];
```

### 2.4 游戏状态（state）

```javascript
// 持久化到 localStorage，单键存 JSON
const state = {
  completedSections: {},   // { "01_小节.md": true } 小节完成标记
  exp: 0,                  // 当前级经验
  totalExp: 0,             // 累计经验
  level: 1,                // 等级
  quizStats: { attempts: 0, bestStreak: 0, bestRank: '', sCount: 0, aCount: 0 },
  // ...（其余为学习记录，可裁剪）
};
```

**判定逻辑**：
- 一"章通关" = 该章所有小节都在 `completedSections` 中为 true
- `getSectionKey(ch, sec)` = `` `${ch.folder}/${sec}.md` ``
- 经验/等级规则：每级所需经验 = `等级 × 100`；`addExp` 累计，溢出升级

---

## 三、页面结构（HTML）

需要以下关键容器（以下 ID 必须一致）：

```html
<!-- 闯关地图视图 -->
<div class="view" id="roadmapView">
  <div class="roadmap-content">
    <!-- 返回按钮 -->
    <button class="game-back-btn" id="gameBackBtn">返回</button>

    <!-- 顶栏 HUD（等级/生命/经验/进度） -->
    <div class="game-hud" id="gameHud">
      <div class="hud-level-text" id="hudLevel">LV.1</div>
      <div class="hud-level-title" id="hudTitle">学徒</div>
      <div class="hud-hearts" id="hudHearts"></div>
      <div class="hud-exp-bar-inner" id="hudExpBar"></div>
      <div class="hud-exp-nums" id="hudExpNums">0 / 100</div>
      <strong id="hudProgress">0/14</strong>
    </div>

    <!-- 地图容器 -->
    <div class="game-world-container" id="mapContainer">
      <svg id="skill-tree-svg" viewBox="0 0 4200 2400" preserveAspectRatio="xMidYMid meet">
        <!-- 多个图层，见下方地图渲染章节 -->
        <g id="map-group">
          <g id="terrain-container"></g>
          <g id="links-container"></g>
          <g id="nodes-container"></g>
        </g>
      </svg>

      <!-- 小地图 -->
      <div class="minimap-container" id="minimapContainer">
        <canvas id="minimapCanvas"></canvas>
      </div>

      <!-- 任务面板 -->
      <div class="quest-panel">
        <div id="questTitle"></div>
        <div id="questReward"></div>
        <div class="quest-panel-progress-fill" id="questProgressFill"></div>
        <button id="questCtaBtn">⚔️ 挑战此章</button>
      </div>

      <!-- 波次战斗面板（就地展开） -->
      <div class="battle-panel" id="battlePanel" hidden>
        <div class="battle-title" id="battleTitle"></div>
        <div id="battleWave"></div>
        <div id="battleLives"></div>
        <div id="battleEnemy"></div>
        <div id="battleEnemyName"></div>
        <div class="battle-hpfill" id="battleHpFill"></div>
        <div id="battleQtag"></div>
        <div id="battleQuestion"></div>
        <div class="battle-timer-fill" id="battleTimerFill"></div>
        <span id="battleTimerText">15</span>
        <div id="battleOptions"></div>
        <div id="battleFeedback"></div>
      </div>
    </div>

    <!-- 旧版全屏测验弹窗（可选保留） -->
    <div class="skill-quiz-overlay" id="quizOverlay" hidden>
      <!-- ... quizLives / quizTimerFill / quizBody / quizProgressFill ... -->
    </div>
  </div>
</div>
```

---

## 四、地图渲染（SVG 核心）

### 4.1 节点生成（generateNodes）

每章产生两类节点：
- **1 个主干节点（城堡）**：id = `` `${ch.id}.1` ``
- **N 个分支节点（营地）** = 该章 `sections.length - 1` 个，id = `` `${ch.id}.${i+2}` ``

```javascript
function generateNodes() {
  const nodes = [];
  CHAPTERS.forEach((ch, chIdx) => {
    nodes.push({ id: `${ch.id}.1`, chapter: chIdx+1, section: 1,
                 name: ch.sectionTitles[0] || ch.title, icon: ch.icon,
                 isMain: true, isStart: chIdx===0, isEnd: chIdx===CHAPTERS.length-1, chIdx });
    for (let i = 1; i < ch.sections.length; i++) {
      nodes.push({ id: `${ch.id}.${i+1}`, chapter: chIdx+1, section: i+1,
                   name: ch.sectionTitles[i] || ch.sections[i], icon: ch.icon,
                   isMain: false, chIdx });
    }
  });
  return nodes;
}
```

### 4.2 位置生成（王国之路布局）

设计参考 *Kingdom Rush*：一条从左下到右上的蜿蜒"王国之路"，城堡等距分布，营地散落在城堡周围。

```javascript
// 道路关键点（viewBox 单位 0~4200 x 0~2400）
const ROAD_POINTS = [
  { x: 160,  y: 2050 }, { x: 480,  y: 1850 }, { x: 860,  y: 2050 },
  { x: 1240, y: 1650 }, { x: 1720, y: 1880 }, { x: 2180, y: 1380 },
  { x: 2660, y: 1680 }, { x: 3180, y: 1200 }, { x: 3760, y: 1500 },
  { x: 4080, y: 1080 },
];

function generatePositions(nodes) {
  // 1. 把道路采样成点列，预计算累计弧长 → 用于沿路等距取点
  // 2. 对每章 c：t = 0.06 + (0.94-0.06) * c/(N-1)，沿道路取位置
  //    左右交替偏移 lateral = ±(90 + 20*sin(c*1.7))，形成"之"字
  // 3. 起点固定在(180,2050)，终点固定在(4020,1080)
  // 4. 每个城堡周边：以 baseAngle = (b/count)*PI*1.7 + 0.35 + c*0.35，
  //    radius = 130 + 26*sin(c*2.1 + b*0.7)，扇开分布营地
  // 5. 坐标 clamp 到 [110,4090] x [120,2260]
}
```

**算法要点**：
- `roadPosAt(t, lateral)` 沿样点二分查找 + 线性插值定位，得到当前位置和道路切线角 `ang`
- 营地坐标 = `` main + (cos(baseAngle)*radius, sin(baseAngle)*radius) ``
- 节点→坐标映射存进 `nodeMap`，供连线引用

### 4.3 地形与道路渲染（renderTerrain / renderRoad）

- **3 个纵向色带**（CSS 变量 `--zone` 控制颜色）：绿野村庄 / 崇山峻岭 / 龙之领域
- 随机装饰：左侧 16 棵随机树/草丛、中部 8 座山 + 40 个雪点、右侧 12 个熔岩粒子
- 王国之路：一条宽土路（`kingdom-road base` 宽、深色；`top` 窄、亮色），沿采样点画折线

### 4.4 连线渲染

贝塞尔曲线连接相邻章节城堡（主线）和城堡->营地（分支线）：
```javascript
// buildCurvePath：端点间用两个控制点做三次贝塞尔，带轻微随机弯曲和方向多样性
// 主线带箭头 marker，已完成的主线有流动虚线动画
```

### 4.5 节点状态判断（getNodeStatus）

```javascript
function getNodeStatus(node) {
  const ch = CHAPTERS[node.chIdx];
  const chCleared = ch.sections.every(s => state.completedSections[key(s)]);
  const chUnlocked = node.chIdx === 0 || chIsCleared(node.chIdx - 1);
  // 返回 { isLocked, isCompleted, isUnlocked }
  // start 永不锁定；main 章节全清=completed；支线看该小节是否完成
}
```

---

## 五、SVG 节点绘制（城堡 & 营地）

### 5.1 城堡（主干节点）

用 SVG path 手绘，包含：基座阴影（椭圆）、城墙（凹凸起伏的矩形 path）、三角形塔顶（由 `--castle-accent` 着色）、弧形城门、中间的数字编号、完成时的旗帜。下方两行文字（章节名 + 地域名）。

### 5.2 营地（分支节点）

帐篷 = 三角形 path + 椭圆地基，中间显示"章.节"编号，完成时插小旗，锁定时显示 🔒 图标。

### 5.3 状态样式

节点分组上设置 `data-locked` / `data-completed`，CSS 用类控制透明度和动画：
- `.open` 可交互：hover 时金色辉光 + 塔顶脉冲
- `.done` 已完成：墙/顶变翠绿（`#34d399`）
- `.locked` 锁定：50% 透明 + 灰阶

---

## 六、相机系统（平移缩放）

这是最精细的部分，坐标有两个体系：**viewBox 单位（0~4200/0~2400）** 与 **屏幕像素**。

```javascript
// SVG 组变换：<g transform="translate(currentX,currentY) scale(scale)">
// fit = min(容器宽/4200, 容器高/2400)   // meet 适配缩放

// 屏幕像素(相对视口) → viewBox：
x_vb = (px - r.left - offsetX) / (scale*fit) - currentX/scale;

// viewBox → 屏幕：
x_px = r.left + offsetX + (vx*scale + currentX) * fit;

// 缩放（以屏幕锚点，保持该点世界坐标不动）：
ns = clamp(scale*factor, 0.35, 2.5);
Kx = (screenX - r.left - offsetX)/fit;
currentX = Kx - (Kx - currentX) * (ns/scale);
```

- **拖拽**平移、**滚轮**以光标为锚点缩放
- **缓动相机** `easeCameraTo`：ease-out 三次曲线，600ms
- **自动聚焦**：首次进入时对准第一个未通关章节
- clampPosition：缩放>1 时限制不越界，缩放<1 时居中留白
- 键盘：WASD/方向键平移，`+`/`-` 缩放，`0` 复位，`1-9` 跳章节，`F` 聚焦，空格随机开打

---

## 七、小地图（Canvas）

右上角常驻，将 4200x2400 世界缩放到面板：
- 节点：已完成=翠绿、锁定=灰、起点=金、终点=紫、进行中=靛蓝
- 视口矩形：金色描边 + 微亮填充，随相机实时移动
- 点击小地图 → 相机平滑移动到对应世界坐标

---

## 八、波次战斗 RPG 系统（核心玩法）

### 8.1 怪物定义（MONSTER）

```javascript
const MONSTER = {
  slime:  { name: '史莱姆', hp: 1, c: '#5CB85C', svg: '<svg viewBox="0 0 100 100">...</svg>' },
  goblin: { name: '哥布林', hp: 1, c: '#8FBE4E', svg: '...' },
  orc:    { name: '兽人',   hp: 2, c: '#C05A43', svg: '...' },
  dragon: { name: '魔龙',   hp: 3, c: '#8A5BD6', svg: '...' },
};
// 怪物用内联 SVG 绘制（史莱姆/哥布林/兽人/魔龙各一幅）
```

### 8.2 波次构建（buildBattleWaves）

按难度分类抽题，一章 3 波 + BOSS：
```javascript
function buildBattleWaves(chapterId) {
  // easy = difficulty 1, mid = 2, hard = 3（某档没有则退回全题库）
  const wave1 = pick(3, 'slime');   // 基础
  const wave2 = pick(4, 'goblin');  // 中等
  const wave3 = pick(3, 'orc');     // 困难
  const boss  = pick(1, 'dragon');  // 魔龙 BOSS
  return [wave1, wave2, [...wave3, ...boss]];  // 过滤空波
}
```

### 8.3 战斗逻辑（battle 对象）

```javascript
const battle = {
  active:false, chapterIdx:-1, chapterId:'',
  waves:[], waveIdx:0, enemies:[], eIdx:0,
  enemy:null, q:null,
  lives:3, maxLives:3, streak:0, score:0, correct:0, total:0,
  timer:15, timerInterval:null, locked:false,
};
```

核心流程：
```
openBattle(chIdx)
  → 生成波次, 打开面板, 加载第1波
showBattleEnemy()
  → 渲染怪物 + 一道题, 开始15秒计时
chooseBattleOption(i)
  → 答对: 怪物扣血(HP-1), 连击+1, 分数+10*min(连击,5)
      - 怪HP归0 → 击杀动画, 下一只/下一波
      - 怪未死 → 换同难度新题继续打
  → 答错/超时: 生命-1(扣心), 连击清零
      - 生命归0 → battleFail 城堡失守
battleWaveClear() → 全部波次打完 → battleClear
battleClear() → 计算经验, markChapterCompleted, 庆祝
```

**机制细节**：
- 每题 15 秒，超时记一次 wrong
- **连击奖励**：≥3 提示"🔥N连击"，≥5 **恢复 1 颗心**，分数随连击翻倍（上限 5）
- BOSS 有 3 血，需连答 3 题才击杀
- 完美通关（满血）额外 +20 经验
- 结算经验 = `Math.floor(正确率/100*20) + 连击加成 + 满血奖励`

### 8.4 视觉反馈

- 怪物动画：`spawn`（出生弹跳）/ `hit`（受击左右摇摆）/ `die`（放大消失）
- 血条：红橙黄渐变，随 HP 实时变窄
- 粒子爆发 + 经验"飞字"（+XP 漂浮上升）
- 地图震动动画（答错时）
- Web Audio 合成音效（correct/wrong/combo/levelup/victory/wave/lock），不依赖音频文件

---

## 九、旧版全屏测验（可选保留）

全屏弹窗（`#quizOverlay`），与战斗并行保留：
- 每题 15 秒、3 心、连击、"50/50"提示（`H` 键排除两个错误选项）
- 结算评级 **S/A/B/C/D**：S=满分满血、A=正确率≥80%且血≥66%……
- 评级经验加成：S+50 / A+30 / B+15 / C+5 / D+0
- 章节测验 100% → 标记通关

---

## 十、CSS 样式要点（game.css）

视觉风格：**明快的故事书奇幻风**（浅色草地 + 土路 + 白石城堡 + 彩色帐篷）。

### 关键设计 token
```css
:root {
  --game-gold: #fbbf24;        /* 起点/奖励 */
  --game-emerald: #10b981;     /* 已完成 */
  --game-violet: #a855f7;      /* 终点 */
  --game-font: 圆润中文字体;
  --castle-accent: 每个城堡的主色;
}
```

### 模块清单（按文件内注释段落）
1. HUD 顶栏 —— 毛玻璃悬浮条，分区块（等级/生命/经验条/进度）
2. 地图容器 —— 浅色草地渐变 + 星空闪烁动画
3. 节点图标 —— 状态驱动（`normal`/`start`/`end`/`completed`/`locked`），带辉光脉冲动画
4. 连接线 —— 主线/分支/已完成（流动虚线 `energyFlow`）
5. 迷雾系统（fog-of-war，可留可删）
6. 小地图 + 缩放控件 + 任务面板 + 拖拽提示
7. 工具提示（tooltip）
8. 粒子特效 / 点击涟漪 / 经验飞字 / 章节通关大字 / 地图震动
9. 战斗测验弹窗（全屏 + 计时条 + 选项 + 结算）
10. 波次战斗面板（就地展开，右下角，浅色玻璃风）

**响应式**：`@media 768px` 与 `480px` 两档，缩小 HUD/地图/面板。

---

## 十一、音效（Web Audio，无音频文件）

```javascript
function playSound(type) {
  // 用 OscillatorNode + GainNode 合成
  // click: 200→80Hz 下滑
  // correct: 523→784Hz 上滑
  // wrong: 196→98Hz 下滑
  // combo: triangle 600→1200Hz
  // levelup: sawtooth 330→880Hz
  // victory: 523/659/784/1047 四音连奏
  // 首次用户点击页面时初始化 AudioContext（需用户手势）
}
```
开关存 localStorage 键 `c_sound_enabled`。

---


## 十三、先做"一模一样"版本的验收清单

完成后逐项核对：
- [ ] 地图显示 14 座城堡 + 营地，沿"王国之路"分布
- [ ] 点击城堡弹出波次战斗面板，3 波 + BOSS
- [ ] 答题正确扣怪血、击杀爆粒子、连击有反馈
- [ ] 答错扣心、超时扣心、3 心归零失败
- [ ] 通关一章 → 城堡变翠绿插旗、地图重新渲染
- [ ] 未通关上一章 → 下一章锁定灰色 🔒
- [ ] 顶部 HUD：等级/生命/经验条/进度 实时更新
- [ ] 小地图可点击跳转、缩放控件可用、拖拽可用
- [ ] WASD/方向键/1-9/空格/快捷键全部生效
- [ ] 战斗结算给予经验、升级出现动画与音效
- [ ] localStorage 刷新后进度保留
