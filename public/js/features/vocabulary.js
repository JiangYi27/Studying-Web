/* ========== 背单词模块 (SPA嵌入式) ========== */
(function() {
    'use strict';

    // ==================== 配置 ====================
    const LIST_CONFIG = {
        'cet4': { name: '英语四级', file: '/English-vocabulary/四级.jsonl' },
        'cet6': { name: '英语六级', file: '/English-vocabulary/六级.jsonl' }
    };

    const MAX_NEW_PER_DAY = 15;      // 每日新词上限
    const STREAK_TO_MASTER = 3;      // 连续答对3次才算真正掌握
    const SRS_INTERVALS = [0, 1, 3, 7, 14, 30]; // L0-L5 对应间隔

    // ==================== 状态 ====================
    let currentList = 'cet4';
    let wordData = [];
    let learnQueue = [];
    let reviewQueue = [];
    let currentIndex = 0;
    let isFlipped = false;
    let currentWord = null;
    let currentFilter = 'all';
    let isInitialized = false;

    // ==================== 工具函数 ====================
    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }
    function storageKey(k) { return 'vocab2_' + currentList + '_' + k; }
    function getToday() { return new Date().toISOString().split('T')[0]; }

    // 加载进度
    function loadProgress() {
        try { return JSON.parse(localStorage.getItem(storageKey('progress'))) || {}; } catch(e) { return {}; }
    }

    function saveProgress(wordId, level, streak, totalCorrect) {
        var p = loadProgress();
        var today = getToday();
        if (!p[wordId]) {
            p[wordId] = { level: 0, streak: 0, totalCorrect: 0, wrongCount: 0, lastReview: null, nextReview: null };
        }
        p[wordId].level = level;
        p[wordId].streak = streak;
        p[wordId].totalCorrect = totalCorrect || p[wordId].totalCorrect;
        p[wordId].lastReview = today;
        var interval = SRS_INTERVALS[level] || 1;
        var next = new Date();
        next.setDate(next.getDate() + interval);
        p[wordId].nextReview = next.toISOString().split('T')[0];
        localStorage.setItem(storageKey('progress'), JSON.stringify(p));
        return p[wordId];
    }

    function loadTodayStats() {
        var today = getToday();
        try {
            var s = JSON.parse(localStorage.getItem(storageKey('todayStats')));
            if (s && s.date === today) return s;
        } catch(e) {}
        return { learned: 0, reviewed: 0, correct: 0, fuzzy: 0, wrong: 0 };
    }

    function saveTodayStats(s) {
        s.date = getToday();
        localStorage.setItem(storageKey('todayStats'), JSON.stringify(s));
    }

    function loadCheckins() {
        try { return JSON.parse(localStorage.getItem(storageKey('checkins'))) || {}; } catch(e) { return {}; }
    }

    function doCheckin() {
        var today = getToday();
        var checkins = loadCheckins();
        if (checkins[today]) return false;
        checkins[today] = true;
        localStorage.setItem(storageKey('checkins'), JSON.stringify(checkins));
        var streak = loadStreak();
        var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        var yesterdayStr = yesterday.toISOString().split('T')[0];
        if (streak.lastDate === yesterdayStr || streak.lastDate === today) {
            streak.days++;
        } else {
            streak.days = 1;
        }
        streak.lastDate = today;
        localStorage.setItem(storageKey('streak'), JSON.stringify(streak));
        return true;
    }

    function hasCheckedInToday() { return !!loadCheckins()[getToday()]; }

    function loadStreak() {
        try { return JSON.parse(localStorage.getItem(storageKey('streak'))) || { days: 0, lastDate: null }; } catch(e) { return { days: 0, lastDate: null }; }
    }

    function checkStreak() {
        var streak = loadStreak();
        var today = getToday();
        var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        var yesterdayStr = yesterday.toISOString().split('T')[0];
        if (streak.lastDate !== yesterdayStr && streak.lastDate !== today) {
            streak.days = 0;
            localStorage.setItem(storageKey('streak'), JSON.stringify(streak));
        }
        return streak.days;
    }

    function loadFavorites() {
        try { return JSON.parse(localStorage.getItem(storageKey('favorites'))) || []; } catch(e) { return []; }
    }

    function toggleFavorite(wordId, word) {
        var favs = loadFavorites();
        var idx = favs.findIndex(function(f) { return f.id === wordId; });
        if (idx >= 0) favs.splice(idx, 1);
        else favs.push({ id: wordId, word: word.word, phonetic: word.phonetic, definition: word.definition, addedAt: getToday() });
        localStorage.setItem(storageKey('favorites'), JSON.stringify(favs));
        return idx < 0;
    }

    function isFavorite(wordId) { return loadFavorites().some(function(f) { return f.id === wordId; }); }

    // ==================== 加载词库 ====================
    async function loadWordData() {
        var cfg = LIST_CONFIG[currentList];
        try {
            var res = await fetch(cfg.file);
            var text = await res.text();
            var lines = text.trim().split('\n');
            wordData = lines.map(function(l) { try { return parseWord(JSON.parse(l)); } catch(e) { return null; } }).filter(Boolean);
            console.log('[Vocab] ' + cfg.name + ' 加载 ' + wordData.length + ' 词');
        } catch(e) {
            console.error('[Vocab] 加载失败', e);
            wordData = [];
        }
    }

    function parseWord(obj) {
        var c = (obj.content && obj.content.word && obj.content.word.content) || {};
        var def = '', pos = '';
        if (c.trans && c.trans.length > 0) { def = c.trans[0].tranCn || ''; pos = c.trans[0].pos || ''; }
        if (!def && c.syno && c.syno.synos && c.syno.synos.length > 0) { def = c.syno.synos[0].tran || ''; }
        var ex = '', exCn = '';
        if (c.sentence && c.sentence.sentences && c.sentence.sentences.length > 0) {
            ex = c.sentence.sentences[0].sContent || '';
            exCn = c.sentence.sentences[0].sCn || '';
        }
        // 解析词组
        var phrases = [];
        if (c.phrase && c.phrase.phrases) {
            phrases = c.phrase.phrases.slice(0, 4).map(function(p) {
                return { phrase: p.pContent, meaning: p.pCn };
            });
        }
        // 解析同义词
        var synonyms = [];
        if (c.syno && c.syno.synos) {
            c.syno.synos.forEach(function(s) {
                if (s.hwds) synonyms.push.apply(synonyms, s.hwds.slice(0, 3));
            });
            synonyms = synonyms.slice(0, 6);
        }
        // 记忆法
        var remMethod = c.remMethod && c.remMethod.val ? c.remMethod.val : '';
        return {
            id: 'w_' + (obj.wordRank || 0),
            word: obj.headWord || '',
            phonetic: c.usphone || c.phone || '',
            definition: def,
            pos: pos,
            example: ex,
            exampleCn: exCn,
            phrases: phrases,
            synonyms: synonyms,
            remMethod: remMethod
        };
    }

    // ==================== 构建队列 ====================
    function buildQueues() {
        var p = loadProgress();
        var today = getToday();
        var newW = [], revW = [];
        wordData.forEach(function(w) {
            var rec = p[w.id];
            if (!rec) newW.push(Object.assign({}, w));
            else if (rec.nextReview && rec.nextReview <= today) revW.push(Object.assign({}, w));
        });
        learnQueue = newW.slice(0, MAX_NEW_PER_DAY);
        reviewQueue = revW;
        updateReviewBadge();
    }

    function updateReviewBadge() {
        var badge = document.getElementById('reviewBadge');
        if (!badge) return;
        var count = reviewQueue.length;
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }

    // ==================== 视图切换 ====================
    var currentVocabView = 'learn';

    function switchView(view) {
        currentVocabView = view;
        var container = $('#mainContent');
        if (!container) return;
        container.innerHTML = '<div class="vocab-sub-nav"><button class="vocab-sub-nav-btn ' + (view === 'learn' ? 'active' : '') + '" data-v="learn">新词</button><button class="vocab-sub-nav-btn ' + (view === 'review' ? 'active' : '') + '" data-v="review">复习</button><button class="vocab-sub-nav-btn ' + (view === 'stats' ? 'active' : '') + '" data-v="stats">统计</button><button class="vocab-sub-nav-btn ' + (view === 'words' ? 'active' : '') + '" data-v="words">词库</button></div><div class="vocab-content"></div>';
        $$('.vocab-sub-nav-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchView(btn.dataset.v);
            });
        });
        if (view === 'learn') renderLearn();
        else if (view === 'review') renderReview();
        else if (view === 'stats') renderStats();
        else if (view === 'words') renderWords();
    }

    function getContent() { return $('.vocab-content'); }

    // ==================== Learn 视图 ====================
    function renderLearn() {
        if (!$('#mainContent')) return;

        if (currentIndex >= learnQueue.length) {
            showLearnComplete();
            return;
        }
        renderLearnCard();
    }

    function renderLearnCard() {
        var p = loadProgress();
        var s = loadTodayStats();
        currentWord = learnQueue[currentIndex];
        var rec = p[currentWord.id] || { streak: 0 };
        var streak = rec.streak || 0;
        isFlipped = false;
        var fav = isFavorite(currentWord.id);
        var progress = Math.round((currentIndex / learnQueue.length) * 100);

        var dotsHtml = '';
        for (var i = 0; i < STREAK_TO_MASTER; i++) {
            dotsHtml += '<div class="streak-dot' + (i < streak ? ' filled' : '') + '"></div>';
        }

        $('#mainContent').innerHTML =
            '<div class="vocab-learn">' +
                '<div class="vocab-card-section">' +
                    '<div class="vocab-streak-row">' + dotsHtml + '<span class="vocab-streak-text">连续 ' + streak + '/' + STREAK_TO_MASTER + ' 次</span></div>' +
                    '<div class="vocab-flip-card" id="vocabFlipCard">' +
                        '<div class="vocab-card-inner" id="vocabCardInner">' +
                            '<div class="vocab-card-face vocab-card-front">' +
                                '<button class="vocab-fav-btn ' + (fav ? 'active' : '') + '" onclick="vocabApp.toggleFav()"><i class="' + (fav ? 'fas' : 'far') + ' fa-heart"></i></button>' +
                                '<button class="vocab-speak-btn" onclick="vocabApp.speak()"><i class="fas fa-volume-up"></i></button>' +
                                (currentWord.pos ? '<span class="vocab-pos-tag">' + currentWord.pos + '</span>' : '') +
                                '<div class="vocab-word-big">' + currentWord.word + '</div>' +
                                '<div class="vocab-phonetic">' + (currentWord.phonetic ? '/' + currentWord.phonetic + '/' : '') + '</div>' +
                                '<div class="vocab-hint">点击卡片查看释义</div>' +
                            '</div>' +
                            '<div class="vocab-card-face vocab-card-back">' +
                                '<button class="vocab-speak-btn" onclick="vocabApp.speak()"><i class="fas fa-volume-up"></i></button>' +
                                (currentWord.pos ? '<span class="vocab-pos-tag">' + currentWord.pos + '</span>' : '') +
                                '<div class="vocab-def-big">' + currentWord.definition + '</div>' +
                                (currentWord.example ? '<div class="vocab-example-section"><div class="vocab-example-en">' + currentWord.example + '</div><div class="vocab-example-cn">' + currentWord.exampleCn + '</div></div>' : '') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                // 完整信息展示
                '<div class="vocab-word-details">' +
                    (currentWord.phrases && currentWord.phrases.length ? '<div class="vocab-detail-row"><span class="vocab-detail-label">词组</span><span class="vocab-detail-value">' + currentWord.phrases.map(function(p) { return p.phrase + ' ' + p.meaning; }).join('；') + '</span></div>' : '') +
                    (currentWord.synonyms && currentWord.synonyms.length ? '<div class="vocab-detail-row"><span class="vocab-detail-label">同义</span><span class="vocab-detail-value">' + currentWord.synonyms.join(', ') + '</span></div>' : '') +
                    (currentWord.remMethod ? '<div class="vocab-detail-row"><span class="vocab-detail-label">记忆</span><span class="vocab-detail-value">' + currentWord.remMethod + '</span></div>' : '') +
                '</div>' +

                // 操作按钮（始终可点击）
                '<div class="vocab-action-row" id="vocabActionRow">' +
                    '<button class="vocab-btn vocab-btn-ignore" onclick="vocabApp.answer(\'ignore\')"><i class="fas fa-times"></i> 不认识</button>' +
                    '<button class="vocab-btn vocab-btn-fuzzy" onclick="vocabApp.answer(\'fuzzy\')"><i class="fas fa-question"></i> 模糊</button>' +
                    '<button class="vocab-btn vocab-btn-know" onclick="vocabApp.answer(\'know\')"><i class="fas fa-check"></i> 认识</button>' +
                '</div>' +

                // 进度
                '<div class="vocab-progress-section">' +
                    '<div class="vocab-progress-bar"><div class="vocab-progress-fill" style="width:' + progress + '%"></div></div>' +
                    '<div class="vocab-progress-info"><span>第 ' + (currentIndex + 1) + ' 词 / 共 ' + learnQueue.length + ' 词</span><span>' + progress + '%</span></div>' +
                    '<div class="vocab-stats-row"><span>✓ 认识 <b class="c">' + s.correct + '</b></span><span>◐ 模糊 <b class="f">' + s.fuzzy + '</b></span><span>✗ 不认识 <b class="w">' + s.wrong + '</b></span></div>' +
                '</div>' +
            '</div>';

        bindCardFlip();
    }

    function showLearnComplete() {
        var s = loadTodayStats();
        var streak = checkStreak();
        $('#mainContent').innerHTML =
            '<div class="vocab-complete">' +
                '<div class="vocab-complete-icon">🎉</div>' +
                '<div class="vocab-complete-title">今日新词学习完成！</div>' +
                '<div class="vocab-complete-desc">连续打卡 ' + streak + ' 天</div>' +
                '<div class="vocab-complete-stats">' +
                    '<div class="vocab-stat-box"><div class="vocab-stat-num c">' + s.correct + '</div><div class="vocab-stat-label">认识</div></div>' +
                    '<div class="vocab-stat-box"><div class="vocab-stat-num f">' + s.fuzzy + '</div><div class="vocab-stat-label">模糊</div></div>' +
                    '<div class="vocab-stat-box"><div class="vocab-stat-num w">' + s.wrong + '</div><div class="vocab-stat-label">不认识</div></div>' +
                '</div>' +
                '<div class="vocab-complete-actions">' +
                    '<button class="vocab-btn-primary" onclick="vocabApp.redoLearn()"><i class="fas fa-redo"></i> 重学</button>' +
                    '<button class="vocab-btn-secondary" onclick="vocabApp.goReview()"><i class="fas fa-sync"></i> 去复习</button>' +
                '</div>' +
            '</div>';
    }

    function bindCardFlip() {
        var card = $('#vocabFlipCard');
        if (card) card.addEventListener('click', function() { vocabApp.flip(); });
    }

    // ==================== Review 视图 ====================
    function renderReview() {
        var container = $('#mainContent');
        if (!container) return;
        buildQueues();

        if (reviewQueue.length === 0) {
            var streak = checkStreak();
            $('#mainContent').innerHTML =
                '<div class="vocab-complete">' +
                    '<div class="vocab-complete-icon">✨</div>' +
                    '<div class="vocab-complete-title">今日复习已完成！</div>' +
                    '<div class="vocab-complete-desc">连续打卡 ' + streak + ' 天</div>' +
                    '<div class="vocab-complete-actions">' +
                        '<button class="vocab-btn-primary" onclick="vocabApp.goLearn()"><i class="fas fa-book"></i> 去学新词</button>' +
                    '</div>' +
                '</div>';
            return;
        }

        var s = loadTodayStats();
        var html = '<div class="vocab-review-list">' +
            '<div class="vocab-review-header"><span>今日待复习 ' + reviewQueue.length + ' 词</span><span style="font-size:12px;color:var(--text-muted)">点击卡片开始复习</span></div>';

        reviewQueue.forEach(function(w, i) {
            var rec = loadProgress()[w.id] || {};
            var level = rec.level || 0;
            var statusClass = level >= 5 ? 'mastered' : level > 0 ? 'learning' : 'new';
            var statusText = level >= 5 ? '已掌握' : level > 0 ? 'L' + level : '新词';
            html += '<div class="vocab-review-item" data-idx="' + i + '">' +
                '<div class="vocab-review-word">' + w.word + ' <span class="vocab-review- phonetic">/' + (w.phonetic || '') + '/</span></div>' +
                '<div class="vocab-review-def">' + w.definition + '</div>' +
                '<span class="vocab-status ' + statusClass + '">' + statusText + '</span>' +
            '</div>';
        });

        html += '</div>';
        $('#mainContent').innerHTML = html;

        $$('.vocab-review-item').forEach(function(item) {
            item.addEventListener('click', function() {
                showReviewCard(parseInt(item.dataset.idx));
            });
        });
    }

    function showReviewCard(idx) {
        var container = $('#mainContent');
        if (!container) return;
        var w = reviewQueue[idx];
        if (!w) return;
        currentWord = w;
        var p = loadProgress()[w.id] || { streak: 0 };
        var streak = p.streak || 0;
        isFlipped = false;
        var fav = isFavorite(w.id);
        var progress = Math.round(((reviewQueue.length - idx) / reviewQueue.length) * 100);

        var dotsHtml = '';
        for (var i = 0; i < STREAK_TO_MASTER; i++) {
            dotsHtml += '<div class="streak-dot' + (i < streak ? ' filled' : '') + '"></div>';
        }

        $('#mainContent').innerHTML =
            '<div class="vocab-learn">' +
                '<div class="vocab-card-section">' +
                    '<div class="vocab-streak-row">' + dotsHtml + '<span class="vocab-streak-text">连续 ' + streak + '/' + STREAK_TO_MASTER + ' 次</span></div>' +
                    '<div class="vocab-flip-card" id="vocabFlipCard">' +
                        '<div class="vocab-card-inner" id="vocabCardInner">' +
                            '<div class="vocab-card-face vocab-card-front">' +
                                '<button class="vocab-fav-btn ' + (fav ? 'active' : '') + '" onclick="vocabApp.toggleFav()"><i class="' + (fav ? 'fas' : 'far') + ' fa-heart"></i></button>' +
                                '<button class="vocab-speak-btn" onclick="vocabApp.speak()"><i class="fas fa-volume-up"></i></button>' +
                                (w.pos ? '<span class="vocab-pos-tag">' + w.pos + '</span>' : '') +
                                '<div class="vocab-word-big">' + w.word + '</div>' +
                                '<div class="vocab-phonetic">' + (w.phonetic ? '/' + w.phonetic + '/' : '') + '</div>' +
                                '<div class="vocab-hint">点击查看释义</div>' +
                            '</div>' +
                            '<div class="vocab-card-face vocab-card-back">' +
                                '<button class="vocab-speak-btn" onclick="vocabApp.speak()"><i class="fas fa-volume-up"></i></button>' +
                                '<div class="vocab-def-big">' + w.definition + '</div>' +
                                (w.example ? '<div class="vocab-example-section"><div class="vocab-example-en">' + w.example + '</div><div class="vocab-example-cn">' + w.exampleCn + '</div></div>' : '') +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="vocab-word-details">' +
                    (w.phrases && w.phrases.length ? '<div class="vocab-detail-row"><span class="vocab-detail-label">词组</span><span class="vocab-detail-value">' + w.phrases.map(function(p) { return p.phrase + ' ' + p.meaning; }).join('；') + '</span></div>' : '') +
                    (w.synonyms && w.synonyms.length ? '<div class="vocab-detail-row"><span class="vocab-detail-label">同义</span><span class="vocab-detail-value">' + w.synonyms.join(', ') + '</span></div>' : '') +
                    (w.remMethod ? '<div class="vocab-detail-row"><span class="vocab-detail-label">记忆</span><span class="vocab-detail-value">' + w.remMethod + '</span></div>' : '') +
                '</div>' +

                '<div class="vocab-action-row" id="vocabActionRow">' +
                    '<button class="vocab-btn vocab-btn-ignore" onclick="vocabApp.answerReview(\'ignore\', ' + idx + ')"><i class="fas fa-times"></i> 不认识</button>' +
                    '<button class="vocab-btn vocab-btn-fuzzy" onclick="vocabApp.answerReview(\'fuzzy\', ' + idx + ')"><i class="fas fa-question"></i> 模糊</button>' +
                    '<button class="vocab-btn vocab-btn-know" onclick="vocabApp.answerReview(\'know\', ' + idx + ')"><i class="fas fa-check"></i> 认识</button>' +
                '</div>' +

                '<div class="vocab-progress-section">' +
                    '<div class="vocab-progress-bar"><div class="vocab-progress-fill" style="width:' + progress + '%"></div></div>' +
                    '<div class="vocab-progress-info"><span>剩余 ' + (reviewQueue.length - idx) + ' 词</span><span>' + progress + '%</span></div>' +
                '</div>' +
            '</div>';

        bindCardFlip();
    }

    // ==================== Stats 视图 ====================
    function renderStats() {
        var container = $('#mainContent');
        if (!container) return;
        var p = loadProgress();
        var s = loadTodayStats();
        var streak = checkStreak();
        var checkins = loadCheckins();

        var learnedCount = Object.keys(p).length;
        var masteredCount = Object.keys(p).filter(function(k) { return p[k].level >= 5; }).length;
        var newCount = wordData.length - learnedCount;

        var cal = '';
        var start = new Date(); start.setDate(start.getDate() - 34);
        for (var i = 0; i < 35; i++) {
            var d = new Date(start); d.setDate(start.getDate() + i);
            var ds = d.toISOString().split('T')[0];
            var level = checkins[ds] ? 4 : 0;
            cal += '<div class="cal-day l' + level + '" title="' + ds + '">' + d.getDate() + '</div>';
        }

        $('#mainContent').innerHTML =
            '<div class="vocab-stats-grid">' +
                '<div class="vocab-stat-card"><div class="vocab-stat-num-lg">' + streak + '</div><div class="vocab-stat-label">连续打卡</div></div>' +
                '<div class="vocab-stat-card"><div class="vocab-stat-num-lg">' + learnedCount + '</div><div class="vocab-stat-label">已学词数</div></div>' +
                '<div class="vocab-stat-card"><div class="vocab-stat-num-lg" style="color:var(--warning)">' + reviewQueue.length + '</div><div class="vocab-stat-label">待复习</div></div>' +
            '</div>' +

            '<div class="vocab-stats-section">' +
                '<div class="vocab-section-title">今日进度</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);margin-bottom:6px">' +
                    '<span>新词 ' + s.learned + '</span><span>复习 ' + s.reviewed + '</span>' +
                '</div>' +
                '<div class="vocab-progress-bar"><div class="vocab-progress-fill" style="width:' + (s.learned + s.reviewed > 0 ? (s.reviewed / (s.learned + s.reviewed) * 100) : 0) + '%"></div></div>' +
            '</div>' +

            '<div class="vocab-stats-section">' +
                '<div class="vocab-section-title">打卡日历（近5周）</div>' +
                '<div class="calendar-grid">' + cal + '</div>' +
            '</div>' +

            '<div class="vocab-stats-section">' +
                '<div class="vocab-section-title">词库进度</div>' +
                '<div class="vocab-progress-row"><span>已掌握</span><span>' + masteredCount + ' / ' + wordData.length + '</span></div>' +
                '<div class="vocab-progress-bar"><div class="vocab-progress-fill" style="width:' + (wordData.length > 0 ? masteredCount / wordData.length * 100 : 0) + '%"></div></div>' +
                '<div class="vocab-progress-row" style="margin-top:8px"><span>学习中</span><span>' + (learnedCount - masteredCount) + ' 词</span></div>' +
                '<div class="vocab-progress-row"><span>新词</span><span>' + newCount + ' 词</span></div>' +
            '</div>';
    }

    // ==================== Words 视图 ====================
    function renderWords() {
        var container = $('#mainContent');
        if (!container) return;
        var p = loadProgress();
        var favs = loadFavorites().map(function(f) { return f.id; });

        var words = wordData;
        if (currentFilter === 'new') words = wordData.filter(function(w) { return !p[w.id]; });
        else if (currentFilter === 'learning') words = wordData.filter(function(w) { return p[w.id] && p[w.id].level < 5; });
        else if (currentFilter === 'mastered') words = wordData.filter(function(w) { return p[w.id] && p[w.id].level >= 5; });
        else if (currentFilter === 'fav') words = wordData.filter(function(w) { return favs.indexOf(w.id) !== -1; });

        var allCount = wordData.length;
        var newCount = wordData.length - Object.keys(p).length;
        var learningCount = Object.keys(p).filter(function(k) { return p[k].level < 5; }).length;
        var masteredCount = Object.keys(p).filter(function(k) { return p[k].level >= 5; }).length;

        var html = '<div class="vocab-words-filter">' +
            '<button class="filter-btn ' + (currentFilter === 'all' ? 'active' : '') + '" data-filter="all">全部 ' + allCount + '</button>' +
            '<button class="filter-btn ' + (currentFilter === 'new' ? 'active' : '') + '" data-filter="new">新词 ' + newCount + '</button>' +
            '<button class="filter-btn ' + (currentFilter === 'learning' ? 'active' : '') + '" data-filter="learning">学习中 ' + learningCount + '</button>' +
            '<button class="filter-btn ' + (currentFilter === 'mastered' ? 'active' : '') + '" data-filter="mastered">已掌握 ' + masteredCount + '</button>' +
            '<button class="filter-btn ' + (currentFilter === 'fav' ? 'active' : '') + '" data-filter="fav">收藏 ' + favs.length + '</button>' +
        '</div>' +
        '<div class="vocab-words-list">';

        if (words.length === 0) {
            html += '<div class="vocab-empty">暂无单词</div>';
        } else {
            words.forEach(function(w) {
                var rec = p[w.id] || {};
                var level = rec.level || 0;
                var statusClass = level >= 5 ? 'mastered' : level > 0 ? 'learning' : 'new';
                var statusText = level >= 5 ? '已掌握' : level > 0 ? 'L' + level : '新词';
                var isFav = favs.indexOf(w.id) !== -1;
                html += '<div class="vocab-word-item" data-id="' + w.id + '">' +
                    '<div class="vocab-word-main">' +
                        '<div class="vocab-word-name">' + w.word + ' <span class="vocab-word-phonetic">/' + (w.phonetic || '') + '/</span></div>' +
                        '<div class="vocab-word-def">' + w.definition + '</div>' +
                    '</div>' +
                    '<span class="vocab-status ' + statusClass + '">' + statusText + '</span>' +
                    '<button class="vocab-fav-btn ' + (isFav ? 'active' : '') + '" data-id="' + w.id + '"><i class="' + (isFav ? 'fas' : 'far') + ' fa-heart"></i></button>' +
                '</div>';
            });
        }
        html += '</div>';
        $('#mainContent').innerHTML = html;

        // 单词点击
        $$('.vocab-word-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.vocab-fav-btn')) return;
                var w = wordData.find(function(x) { return x.id === item.dataset.id; });
                if (w) {
                    if (reviewQueue.indexOf(w) === -1) reviewQueue.push(w);
                    currentWord = w;
                    switchView('review');
                    showReviewCard(reviewQueue.indexOf(w));
                }
            });
        });

        // 收藏
        $$('.vocab-fav-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var w = wordData.find(function(x) { return x.id === btn.dataset.id; });
                if (w) {
                    var added = toggleFavorite(w.id, w);
                    btn.classList.toggle('active', added);
                    btn.querySelector('i').className = added ? 'fas fa-heart' : 'far fa-heart';
                }
            });
        });

        // 筛选
        $$('.filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                currentFilter = btn.dataset.filter;
                $$('.filter-btn').forEach(function(b) { b.classList.toggle('active', b === btn); });
                renderWords();
            });
        });
    }

    // ==================== 发音 ====================
    function speak() {
        if (!currentWord && learnQueue[currentIndex]) currentWord = learnQueue[currentIndex];
        if (currentWord && 'speechSynthesis' in window) {
            var utt = new SpeechSynthesisUtterance(currentWord.word);
            utt.lang = 'en-US';
            utt.rate = 0.85;
            speechSynthesis.speak(utt);
        }
    }

    // ==================== API ====================
    window.vocabApp = {
        flip: function() {
            isFlipped = !isFlipped;
            var inner = $('vocabCardInner');
            var btns = $('vocabActionRow');
            if (inner) inner.classList.toggle('flipped', isFlipped);
        },

        speak: speak,

        toggleFav: function() {
            if (!currentWord) return;
            var added = toggleFavorite(currentWord.id, currentWord);
            var btn = $('.vocab-fav-btn');
            if (btn) {
                btn.classList.toggle('active', added);
                btn.querySelector('i').className = added ? 'fas fa-heart' : 'far fa-heart';
            }
        },

        answer: function(type) {
            if (!currentWord) return;

            var p = loadProgress();
            var rec = p[currentWord.id] || { streak: 0, totalCorrect: 0 };
            var streak = rec.streak || 0;
            var level = rec.level || 0;
            var totalCorrect = rec.totalCorrect || 0;

            var s = loadTodayStats();
            s.learned++;
            if (type === 'know') { s.correct++; totalCorrect++; }
            else if (type === 'fuzzy') { s.fuzzy++; }
            else { s.wrong++; }
            saveTodayStats(s);

            if (type === 'know') {
                streak++;
                level = Math.min(level + 1, 5);
            } else if (type === 'fuzzy') {
                // 模糊：保持streak和level不变，但仍然推进到下一个词
                // 短期内在L0复习（间隔0天），之后根据level安排
            } else {
                streak = 0;
                level = Math.max(level - 1, 0);
            }

            saveProgress(currentWord.id, level, streak, totalCorrect);

            // 无论选择什么，只要不是完成，都推进到下一个词
            currentIndex++;
            isFlipped = false;
            if (currentIndex >= learnQueue.length) {
                renderLearn();
            } else {
                renderLearnCard();
            }
        },

        answerReview: function(type, idx) {
            var w = reviewQueue[idx];
            if (!w) return;

            var p = loadProgress();
            var rec = p[w.id] || { streak: 0, totalCorrect: 0 };
            var streak = rec.streak || 0;
            var level = rec.level || 0;
            var totalCorrect = rec.totalCorrect || 0;

            var s = loadTodayStats();
            s.reviewed++;
            if (type === 'know') { s.correct++; totalCorrect++; }
            else if (type === 'fuzzy') { s.fuzzy++; }
            else { s.wrong++; }
            saveTodayStats(s);

            if (type === 'know') {
                streak++;
                level = Math.min(level + 1, 5);
            } else if (type === 'fuzzy') {
                // 模糊：保持streak和level不变，继续下一个
            } else {
                streak = 0;
                level = Math.max(level - 1, 0);
            }

            saveProgress(w.id, level, streak, totalCorrect);

            // 无论选择什么，都从复习队列移除并继续下一个
            reviewQueue.splice(idx, 1);

            updateReviewBadge();
            isFlipped = false;

            if (reviewQueue.length === 0) {
                renderReview();
            } else {
                showReviewCard(Math.min(idx, reviewQueue.length - 1));
            }
        },

        redoLearn: function() {
            currentIndex = 0;
            isFlipped = false;
            renderLearn();
        },

        goLearn: function() { switchView('learn'); },
        goReview: function() { switchView('review'); },
        goStats: function() { switchView('stats'); },
        goWords: function() { switchView('words'); },

        // SPA初始化入口
        init: function() {
            if (isInitialized) return;
            isInitialized = true;
            loadWordData().then(function() {
                buildQueues();
                renderLearn();
            });
        }
    };

    // 初始化
    vocabApp.init();

})();
