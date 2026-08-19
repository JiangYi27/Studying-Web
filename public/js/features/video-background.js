'use strict';

// ==================== 视频壁纸配置 ====================
const VIDEO_BG_MAP = {
    grassland: '/video/background/grassland.mp4',
    forest:    '/video/background/forest.mp4',
    city:      '/video/background/city.mp4',
    gallery:   '/video/background/gallery.mp4',
    flower:    '/video/background/flower.mp4',
    gorge:     '/video/background/gorge.mp4',
    'green-gallery': '/video/background/green gallery.mp4',
};

function initVideoBackground() {
    // 背景模式标签页切换
    const bgModeTabs = document.querySelectorAll('.bg-mode-tab');
    const gradientArea = document.getElementById('gradientArea');
    const videoArea = document.getElementById('videoArea');

    bgModeTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            const mode = tab.dataset.bgMode;
            bgModeTabs.forEach(function (t) {
                t.classList.toggle('active', t === tab);
                t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            if (mode === 'gradient') {
                if (gradientArea) gradientArea.style.display = '';
                if (videoArea) videoArea.style.display = 'none';
            } else {
                if (gradientArea) gradientArea.style.display = 'none';
                if (videoArea) videoArea.style.display = '';
            }
        });
    });

    // 视频卡片选择
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(function (card) {
        card.addEventListener('click', function () {
            const videoId = card.dataset.video;
            state.videoBg = videoId;
            state.gradientBg = 'none';
            applyGradientBg('none');
            applyVideoBackground();
            videoCards.forEach(function (c) {
                c.classList.toggle('active', c === card);
                c.setAttribute('aria-pressed', c === card ? 'true' : 'false');
            });
            document.querySelectorAll('.gradient-option').forEach(function (opt) {
                opt.classList.toggle('active', opt.dataset.gradient === 'none');
            });
            const videoTab = document.querySelector('.bg-mode-tab[data-bg-mode="video"]');
            if (videoTab && !videoTab.classList.contains('active')) videoTab.click();
            saveStateDebounced();
        });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
        });
    });

    // 动态/静态模式切换
    const videoStaticToggle = document.getElementById('videoStaticMode');
    const videoModeLabel = document.getElementById('videoModeLabel');
    if (videoStaticToggle) {
        videoStaticToggle.checked = state.videoBgStatic;
        if (videoModeLabel) videoModeLabel.textContent = state.videoBgStatic ? '静态壁纸' : '动态播放';
        videoStaticToggle.addEventListener('change', function () {
            state.videoBgStatic = videoStaticToggle.checked;
            if (videoModeLabel) videoModeLabel.textContent = state.videoBgStatic ? '静态壁纸' : '动态播放';
            toggleVideoMode();
            saveStateDebounced();
        });
    }

    // 预览窗口 hover 时播放预览
    const previewPlayer = document.getElementById('videoPreviewPlayer');
    const previewEmpty = document.getElementById('videoPreviewEmpty');
    const previewLabel = document.getElementById('videoPreviewLabel');
    videoCards.forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            const videoId = card.dataset.video;
            const src = VIDEO_BG_MAP[videoId];
            if (!src || !previewPlayer) return;
            previewPlayer.src = src;
            previewPlayer.style.display = '';
            if (previewEmpty) previewEmpty.style.display = 'none';
            if (previewLabel) {
                previewLabel.textContent = card.querySelector('.video-card-name').textContent;
                previewLabel.style.display = '';
            }
            previewPlayer.currentTime = 0;
            previewPlayer.play().catch(function () {});
        });
        card.addEventListener('mouseleave', function () {
            if (previewPlayer) { previewPlayer.pause(); previewPlayer.src = ''; previewPlayer.style.display = 'none'; }
            if (previewEmpty) previewEmpty.style.display = '';
            if (previewLabel) previewLabel.style.display = 'none';
        });
    });

    // 恢复状态：同步UI
    if (state.videoBg) {
        const activeCard = document.querySelector('.video-card[data-video="' + state.videoBg + '"]');
        if (activeCard) {
            videoCards.forEach(function (c) {
                c.classList.toggle('active', c === activeCard);
                c.setAttribute('aria-pressed', c === activeCard ? 'true' : 'false');
            });
        }
    }
    if (state.videoBgStatic && videoStaticToggle) {
        videoStaticToggle.checked = true;
        if (videoModeLabel) videoModeLabel.textContent = '静态壁纸';
    }

    applyVideoBackground();
}

function applyVideoBackground() {
    const videoEl = document.getElementById('videoBackground');
    const overlay = document.getElementById('videoBgOverlay');
    if (!videoEl) return;

    videoEl.pause();
    videoEl.src = '';
    videoEl.classList.remove('active');

    if (state.videoBg && VIDEO_BG_MAP[state.videoBg]) {
        const src = VIDEO_BG_MAP[state.videoBg];
        videoEl.src = src;
        videoEl.load();
        if (!state.videoBgStatic) {
            videoEl.play().catch(function () {});
        } else {
            videoEl.currentTime = 0;
            videoEl.pause();
        }
        videoEl.classList.add('active');
        if (overlay) overlay.style.display = '';
        document.body.classList.add('video-bg-active');
    } else {
        if (overlay) overlay.style.display = 'none';
        document.body.classList.remove('video-bg-active');
    }
}

function toggleVideoMode() {
    const videoEl = document.getElementById('videoBackground');
    if (!videoEl || !state.videoBg) return;
    if (!state.videoBgStatic) {
        videoEl.play().catch(function () {});
    } else {
        videoEl.currentTime = 0;
        videoEl.pause();
    }
}
