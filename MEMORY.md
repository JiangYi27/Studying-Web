---
name: frontend-state-refactor
description: 前端 state 重构：拆分为 studyStore/uiStore/quizStore
metadata:
  type: project
---

# 前端 state 重构方案

## 目标
将 main.js 中的单一 state 对象拆分为 3 个独立 store。

## 拆分方案

### studyStore（学习进度）
- completedSections, completedDates, sectionStudyTime
- streak, totalDays, totalStudyTime, lastStudyDate
- exp, totalExp, level
- badges, quizStats, quest
- studiedEarly, studiedAtNight
- 暴露为 window.studyStore

### uiStore（UI 偏好）
- darkMode, fontSize, sidebarCollapsed, focusMode
- themeColor, gradientBg, videoBg, videoBgStatic
- dailyGoal, autoMarkCompleted, studyReminder, reminderTime
- reviewInterval, sidebarAutoCollapse
- dailyGoalCompleteDays, dailyGoalMetDate
- 暴露为 window.uiStore

### quizStore（答题数据，studyStore 已含但 quizStats 需独立）
- quizStats: { attempts, bestStreak, bestRank, sCount, aCount }
- 从 studyStore 中提取，作为独立 store

## 文件结构
```
public/js/
├── stores/
│   ├── studyStore.js   # 学习进度 + 持久化
│   ├── uiStore.js      # UI 偏好 + 持久化
│   └── quizStore.js    # 答题数据
├── core/main.js        # 初始化各 store，保留 state 别名兼容
```

## 兼容性策略
- window.studyStore 和 window.uiStore 独立暴露
- window.__appState 仍然指向合并的 state 对象（向后兼容）
- 各 init 函数保持不变，只改变内部数据来源
