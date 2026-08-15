/* ==================== 笔记功能 ==================== */
/* 依赖：state、CHAPTERS、getSectionKey、saveStateDebounced（来自 main.js） */
'use strict';

/**
 * 初始化笔记编辑器
 */
function initNotes() {
    const noteEditor = document.getElementById('noteEditor');
    const saveStatus = document.getElementById('saveStatus');
    if (!noteEditor) return;

    let saveTimeout;
    noteEditor.addEventListener('input', () => {
        if (state.currentChapterIndex === null || state.currentSectionIndex === null) return;
        const ch = CHAPTERS[state.currentChapterIndex];
        const sec = ch.sections[state.currentSectionIndex];
        const secKey = getSectionKey(ch, sec);
        state.notes[secKey] = noteEditor.value;
        if (saveStatus) saveStatus.textContent = '保存中...';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveStateDebounced();
            if (saveStatus) saveStatus.textContent = '已保存 ✓';
            setTimeout(() => {
                if (saveStatus) saveStatus.textContent = '';
            }, 1500);
        }, 600);
    });

    // 插入代码块按钮
    document.getElementById('insertCodeBlock')?.addEventListener('click', () => {
        const start = noteEditor.selectionStart;
        const end = noteEditor.selectionEnd;
        const text = noteEditor.value;
        const selected = text.substring(start, end);
        const replacement = '\n```c\n' + (selected || '// 代码') + '\n```\n';
        noteEditor.value = text.substring(0, start) + replacement + text.substring(end);
        noteEditor.focus();
        noteEditor.dispatchEvent(new Event('input'));
    });

    // 插入粗体按钮
    document.getElementById('insertBold')?.addEventListener('click', () => {
        const start = noteEditor.selectionStart;
        const end = noteEditor.selectionEnd;
        const text = noteEditor.value;
        const selected = text.substring(start, end);
        const replacement = '**' + (selected || '粗体文字') + '**';
        noteEditor.value = text.substring(0, start) + replacement + text.substring(end);
        noteEditor.focus();
        noteEditor.dispatchEvent(new Event('input'));
    });
}
