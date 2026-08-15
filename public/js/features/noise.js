/* ==================== 背景音乐（BGM）系统 ==================== */
/* 依赖：NOISE_STORAGE_KEY（来自 data/chapters.js） */
'use strict';

const BGM_TRACKS = [
    { id: 'after-the-storm',         file: 'After the Storm.mp3',         name: 'After the Storm' },
    { id: 'apollos-triumph',         file: "Apollo's Triumph.mp3",       name: "Apollo's Triumph" },
    { id: 'memories',                file: 'Memories.mp3',                name: 'Memories' },
    { id: 'this-place-is-a-shelter', file: 'This Place is a Shelter.mp3', name: 'This Place is a Shelter' },
    { id: 'we-are-stars',            file: 'We are Stars.mp3',            name: 'We are Stars' },
];

function getBgmTrack(id) {
    return BGM_TRACKS.find(function (t) { return t.id === id; }) || null;
}

function loadNoiseSettings() {
    try {
        const saved = localStorage.getItem(NOISE_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                type: parsed.type || '',
                volume: typeof parsed.volume === 'number' ? parsed.volume : 0.3,
                muted: !!parsed.muted,
                lastVolume: typeof parsed.lastVolume === 'number' ? parsed.lastVolume : (parsed.volume || 0.3),
                playing: !!parsed.playing,
            };
        }
    } catch (e) {}
    return { type: '', volume: 0.3, muted: false, lastVolume: 0.3, playing: false };
}

function saveNoiseSettings(settings) {
    try {
        localStorage.setItem(NOISE_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
}

function initNoise() {
    const noiseQuickBtn   = document.getElementById('noiseQuickBtn');
    const noisePanel      = document.getElementById('noisePanel');
    const noiseSongList   = document.getElementById('noiseSongList');
    const noisePlayBtn    = document.getElementById('noisePlayBtn');
    const noiseStopBtn    = document.getElementById('noiseStopBtn');
    const noiseVolume     = document.getElementById('noiseVolume');
    const noiseAudio      = document.getElementById('noiseAudio');
    const noiseMuteBtn    = document.getElementById('noiseMuteBtn');
    const noiseStatus     = document.getElementById('noiseStatus');
    const noiseSelectSetting = document.getElementById('noiseSelectSetting');
    if (!noiseQuickBtn || !noisePanel || !noiseSongList || !noiseVolume || !noiseAudio) return;

    const settings = loadNoiseSettings();
    let isPlaying = false;

    function currentTrackName() {
        const track = getBgmTrack(settings.type);
        return track ? track.name : '';
    }

    function populateSelect(select) {
        if (!select) return;
        select.innerHTML = '';
        const off = document.createElement('option');
        off.value = '';
        off.textContent = '关闭';
        select.appendChild(off);
        BGM_TRACKS.forEach(function (track) {
            const opt = document.createElement('option');
            opt.value = track.id;
            opt.textContent = track.name;
            select.appendChild(opt);
        });
    }

    function closePanel() {
        if (noisePanel) noisePanel.classList.remove('active');
    }

    function renderSongList() {
        if (!noiseSongList) return;
        noiseSongList.innerHTML = '';
        const offBtn = document.createElement('button');
        offBtn.type = 'button';
        offBtn.className = 'noise-song-item off' + (settings.type === '' ? ' active' : '');
        offBtn.innerHTML = '<span class="song-state"></span><span>关闭</span>';
        offBtn.addEventListener('click', function () { stopTrack(); closePanel(); });
        noiseSongList.appendChild(offBtn);
        BGM_TRACKS.forEach(function (track) {
            const isActive = settings.type === track.id;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'noise-song-item' + (isActive ? ' active' : '');
            item.innerHTML =
                '<span class="song-state">' + (isActive && isPlaying ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>' : '') + '</span>' +
                '<span>' + track.name + '</span>';
            item.addEventListener('click', function () {
                if (isActive && isPlaying) {
                    noiseAudio.pause();
                    settings.playing = false;
                    saveNoiseSettings(settings);
                    updateStatus('已暂停');
                    renderSongList();
                    return;
                }
                if (isActive && !isPlaying) {
                    playTrack(track.id);
                    return;
                }
                playTrack(track.id);
            });
            noiseSongList.appendChild(item);
        });
    }

    function updateButtonState() {
        noiseQuickBtn.classList.toggle('playing', isPlaying && !settings.muted);
    }

    function updatePlayBtn() {
        if (!noisePlayBtn) return;
        noisePlayBtn.classList.toggle('is-playing', isPlaying);
    }

    function updateStatus(text) {
        if (noiseStatus) {
            noiseStatus.textContent = text || '';
            noiseStatus.className = 'noise-status' + (isPlaying ? ' playing' : '');
        }
    }

    function syncSelects() {
        if (noiseSelectSetting) noiseSelectSetting.value = settings.type;
    }

    function playTrack(type) {
        const track = getBgmTrack(type);
        if (!track) { stopTrack(); return; }
        settings.type = type;
        noiseAudio.src = '/audio/' + encodeURIComponent(track.file);
        noiseAudio.volume = settings.muted ? 0 : settings.volume;
        noiseAudio.play().then(function () {
            saveNoiseSettings(settings);
            updateStatus('正在播放 ' + track.name);
            renderSongList();
        }).catch(function () {
            saveNoiseSettings(settings);
            updateStatus('点击页面任意位置可开始播放');
        });
        syncSelects();
        updateButtonState();
        updatePlayBtn();
    }

    function stopTrack() {
        noiseAudio.pause();
        noiseAudio.removeAttribute('src');
        noiseAudio.load();
        settings.type = '';
        settings.playing = false;
        saveNoiseSettings(settings);
        isPlaying = false;
        syncSelects();
        updateStatus('');
        updateButtonState();
        updatePlayBtn();
        renderSongList();
        var viz = document.getElementById('musicVisualizer');
        if (viz) viz.style.display = 'none';

    }

    function togglePlay() {
        if (isPlaying) {
            noiseAudio.pause();
            settings.playing = false;
            saveNoiseSettings(settings);
            updateStatus('已暂停');
            updateButtonState();
            updatePlayBtn();
        } else if (settings.type) {
            playTrack(settings.type);
        }
    }

    populateSelect(noiseSelectSetting);
    renderSongList();
    if (settings.type && noiseSelectSetting) noiseSelectSetting.value = settings.type;

    const initVolume = settings.muted ? (settings.lastVolume || 0.3) : (settings.volume ?? 0.3);
    noiseVolume.value = initVolume;
    noiseAudio.volume = settings.muted ? 0 : initVolume;

    function updateVisualizer() {
        var viz = document.getElementById('musicVisualizer');
        if (!viz) return;
        viz.style.display = (!noiseAudio.paused && !settings.muted && settings.type) ? '' : 'none';
    }

    noiseAudio.addEventListener('play', function () {
        isPlaying = true;
        settings.playing = true;
        saveNoiseSettings(settings);
        updateButtonState();
        updatePlayBtn();
        updateVisualizer();
        updateStatus('正在播放 ' + currentTrackName());
        renderSongList();
    });
    noiseAudio.addEventListener('pause', function () {
        isPlaying = false;
        updateButtonState();
        updatePlayBtn();
        updateVisualizer();
        renderSongList();
    });
    noiseAudio.addEventListener('error', function () {
        if (settings.type) {
            isPlaying = false;
            settings.playing = false;
            saveNoiseSettings(settings);
            updateStatus('音频加载失败，请检查音频文件');
            updateButtonState();
            updatePlayBtn();
        }
    });

    if (noiseSelectSetting) {
        noiseSelectSetting.addEventListener('change', function () {
            const type = noiseSelectSetting.value;
            if (type) playTrack(type);
            else stopTrack();
            renderSongList();
        });
    }

    if (noisePlayBtn) noisePlayBtn.addEventListener('click', function () { togglePlay(); });
    if (noiseStopBtn) noiseStopBtn.addEventListener('click', function () { stopTrack(); closePanel(); });

    noiseVolume.addEventListener('input', function () {
        const vol = parseFloat(noiseVolume.value);
        if (isNaN(vol)) return;
        noiseAudio.volume = settings.muted ? 0 : vol;
        settings.volume = vol;
        if (!settings.muted) settings.lastVolume = vol;
        saveNoiseSettings(settings);
    });

    noiseMuteBtn.addEventListener('click', function () {
        settings.muted = !settings.muted;
        if (settings.muted) {
            settings.lastVolume = settings.volume;
            noiseAudio.volume = 0;
        } else {
            const vol = settings.lastVolume || settings.volume || 0.3;
            noiseAudio.volume = vol;
            noiseVolume.value = vol;
            settings.volume = vol;
        }
        saveNoiseSettings(settings);
        updateButtonState();
        updatePlayBtn();
        updateVisualizer();
    });

    // 音乐图标点击：未展开则展开；已展开则收起并恢复播放/暂停语义
    noiseQuickBtn.addEventListener('click', function (e) {
        if (!noisePanel.classList.contains('active')) {
            noisePanel.classList.add('active');
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        if (isPlaying) {
            noiseAudio.pause();
            settings.playing = false;
            saveNoiseSettings(settings);
            updateStatus('已暂停');
            updateButtonState();
            updatePlayBtn();
        } else if (settings.type) {
            playTrack(settings.type);
        }
        noisePanel.classList.remove('active');
    });

    document.addEventListener('click', function (e) {
        if (!noisePanel.classList.contains('active')) return;
        if (!noisePanel.contains(e.target) && !noiseQuickBtn.contains(e.target)) {
            noisePanel.classList.remove('active');
        }
    });

    let resumeDone = false;
    function tryResume() {
        if (resumeDone) return;
        resumeDone = true;
        if (settings.type && settings.playing && !settings.muted && noiseAudio.paused) {
            playTrack(settings.type);
        }
    }
    document.addEventListener('pointerdown', function (e) {
        if (e.target.closest && e.target.closest('.noise-container')) return;
        if (e.target.tagName === 'SELECT') return;
        tryResume();
    }, { capture: true, passive: true });
    document.addEventListener('keydown', function () {
        tryResume();
    }, { capture: true, passive: true });

    if (settings.type && settings.playing && !settings.muted) {
        const track = getBgmTrack(settings.type);
        if (track) {
            noiseAudio.src = '/audio/' + encodeURIComponent(track.file);
            noiseAudio.volume = settings.volume;
            const p = noiseAudio.play();
            if (p && p.catch) p.catch(function () {});
        }
    }

    updateButtonState();
    updatePlayBtn();
    updateStatus('');
}
