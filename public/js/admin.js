/* ==================== 管理后台 JavaScript ==================== */
'use strict';
(function () {
  var currentAdmin = null, allUsers = [], allContent = [], allSites = [];
  var confirmCallback = null, currentPage = 1, pageSize = 20, selectedDays = 7;
  var trendChart = null, siteChart = null, selectedUsers = new Set();

  document.addEventListener('DOMContentLoaded', function () {
    checkLoginStatus();
    initSidebar();
    initNavigation();
    initLogout();
    initDarkMode();
    initExport();
    initQuickActions();
  });

  // ==================== 工具 ====================
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function $(id) { return document.getElementById(id); }
  function showToast(msg, type) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.className = 'toast ' + (type || '');
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 3000);
  }
  function showConfirmModal(opts) {
    var m = $('confirmModal'); if (!m) { if (confirm(opts.message.replace(/<[^>]*>/g,''))) opts.onConfirm(); return; }
    $('confirmTitle').textContent = opts.title || '确认操作';
    $('confirmMessage').innerHTML = opts.message || '';
    var btn = $('confirmActionBtn'); btn.textContent = opts.confirmText || '确认';
    btn.className = 'btn ' + (opts.confirmClass === 'danger' ? 'btn-danger' : 'btn-primary');
    confirmCallback = opts.onConfirm; m.classList.add('show');
  }
  function closeConfirmModal() { var m = $('confirmModal'); if (m) m.classList.remove('show'); confirmCallback = null; }

  // ==================== 全局键盘 ====================
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    [$('userModal'),$('siteModal'),$('confirmModal'),$('detailModal')].forEach(function(m){if(m&&m.classList.contains('show'))m.classList.remove('show');});
    closeConfirmModal();
  });

  // ==================== 侧边栏 ====================
  function initSidebar() {
    var sidebar = $('sidebar'), toggle = $('sidebarToggle');
    if (!sidebar || !toggle) return;
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
      toggle.querySelector('i').className = sidebar.classList.contains('collapsed') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
    });
  }

  // ==================== 深色模式 ====================
  function initDarkMode() {
    var toggle = $('darkModeToggle'); if (!toggle) return;
    toggle.addEventListener('change', function () { document.body.classList.toggle('dark', this.checked); localStorage.setItem('admin_dark_mode', this.checked ? '1' : '0'); });
    if (localStorage.getItem('admin_dark_mode') === '1') { toggle.checked = true; document.body.classList.add('dark'); }
  }

  // ==================== 登录状态 ====================
  async function checkLoginStatus() {
    try {
      var res = await fetch('/api/admin/status'), data = await res.json();
      if (data.loggedIn) { currentAdmin = data.admin; updateAdminUI(); await loadDashboard(); }
      else window.location.href = '/admin/admin-login.html';
    } catch (e) { window.location.href = '/admin/admin-login.html'; }
  }
  function updateAdminUI() {
    if (currentAdmin) { var el = $('adminName'); if (el) el.textContent = currentAdmin.displayName || currentAdmin.username; }
  }

  // ==================== 导航 ====================
  function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var tabId = this.getAttribute('data-tab');
        document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.remove('active'); });
        var tab = $('tab-' + tabId); if (tab) tab.classList.add('active');
        switch (tabId) {
          case 'dashboard': loadDashboard(); break;
          case 'users': loadUsers(); break;
          case 'content': loadContent(); break;
          case 'knowledge': loadKnowledgeChapters(); break;
          case 'extension': loadExtensions(); break;
          case 'quizzes': loadQuizChapters(); break;
          case 'sites': loadSites(); break;
          case 'settings': loadSettings(); break;
        }
      });
    });
    $('refreshContentBtn').addEventListener('click', loadContent);
    $('addUserBtn').addEventListener('click', function () { openUserModal(); });
    $('saveUserBtn').addEventListener('click', saveUser);
    $('addSiteBtn').addEventListener('click', function () { openSiteModal(); });
    $('saveSiteBtn').addEventListener('click', saveSite);
    // 模态框遮罩关闭
    [$('userModal'),$('siteModal'),$('confirmModal'),$('detailModal')].forEach(function(m){if(m)m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('show');});});
  }

  function initLogout() {
    var btn = $('logoutBtn'); if (!btn) return;
    btn.addEventListener('click', async function () { try { await fetch('/api/admin/logout', { method: 'POST' }); } catch (e) {} window.location.href = '/admin/admin-login.html'; });
  }

  function initExport() {
    var btn = $('exportAllBtn'); if (btn) btn.addEventListener('click', async function () {
      try {
        var res = await fetch('/api/admin/export'), data = await res.json();
        if (data.success) {
          var blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = 'backup_' + new Date().toISOString().slice(0,10) + '.json'; a.click();
          showToast('导出成功', 'success');
        }
      } catch (e) { showToast('导出失败', 'error'); }
    });
    var imp = $('importDataBtn'), impFile = $('importFile');
    if (imp && impFile) { imp.addEventListener('click', function () { impFile.click(); }); impFile.addEventListener('change', function () { showToast('导入功能开发中', 'warning'); impFile.value = ''; }); }
    var clear = $('clearDataBtn'); if (clear) clear.addEventListener('click', function () {
      showConfirmModal({ title: '清除所有数据', message: '确定要清除所有用户的学习数据吗？<br><strong>此操作不可恢复！</strong>', confirmText: '清除数据', confirmClass: 'danger',
        onConfirm: async function () { try { var r = await fetch('/api/admin/clear-data', { method: 'DELETE' }); if ((await r.json()).success) { showToast('数据已清除', 'success'); loadDashboard(); } } catch (e) { showToast('操作失败', 'error'); } }
      });
    });
  }

  function initQuickActions() {
    $('quickExport').addEventListener('click', function () { $('exportAllBtn').click(); });
    $('quickBackup').addEventListener('click', async function () {
      try { var r = await fetch('/api/admin/backup', { method: 'POST' }); if ((await r.json()).success) showToast('备份创建成功', 'success'); } catch (e) { showToast('备份失败', 'error'); }
    });
    // 日期筛选
    document.querySelectorAll('#dateFilter .filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#dateFilter .filter-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active'); selectedDays = parseInt(this.dataset.days); loadDashboard();
      });
    });
    // 确认模态框
    $('confirmCancelBtn').addEventListener('click', closeConfirmModal);
    $('confirmActionBtn').addEventListener('click', function () { if (confirmCallback) confirmCallback(); closeConfirmModal(); });
  }

  // ==================== 仪表盘 ====================
  async function loadDashboard() {
    try {
      var daysParam = selectedDays > 0 ? '?days=' + selectedDays : '';
      var resArr = await Promise.all([
        fetch('/api/admin/stats'), fetch('/api/admin/recent-records'),
        fetch('/api/admin/stats/trends' + daysParam), fetch('/api/admin/sites')
      ]);
      var stats = (await resArr[0].json()).stats || {};
      var records = (await resArr[1].json()).records || [];
      var trends = (await resArr[2].json()).trends || [];
      var sites = (await resArr[3].json()).sites || [];

      // 统计卡片
      var cards = [
        { el:'totalUsers', icon:'users', cls:'blue', label:'注册用户', val:stats.totalUsers },
        { el:'activeUsers', icon:'user-check', cls:'green', label:'活跃用户(7天内)', val:stats.activeUsers },
        { el:'totalStudyTime', icon:'clock', cls:'orange', label:'总学习时长(分钟)', val:stats.totalStudyTime },
        { el:'totalBadges', icon:'trophy', cls:'purple', label:'发放徽章', val:stats.totalBadges },
        { el:'totalExp', icon:'fire', cls:'red', label:'总经验值', val:stats.totalExp },
        { el:'newUsersWeek', icon:'user-plus', cls:'teal', label:'本周新增', val:stats.newUsersThisWeek },
      ];
      var html = '';
      cards.forEach(function (c) {
        html += '<div class="stat-card"><div class="stat-icon '+c.cls+'"><i class="fas fa-'+c.icon+'"></i></div><div class="stat-info"><h3>'+(c.val||0)+'</h3><p>'+c.label+'</p></div></div>';
      });
      $('statsGrid').innerHTML = html;

      // 图表
      renderTrendChart(trends);
      renderSiteChart(sites);

      // 最近记录
      renderRecentRecords(records);

      // 更新导航徽章
      var userBadge = document.querySelector('[data-tab="users"] .nav-badge');
      if (userBadge) userBadge.textContent = stats.totalUsers || 0;
    } catch (e) { console.error('加载仪表盘失败:', e); }
  }

  function renderTrendChart(data) {
    var ctx = $('trendChart'); if (!ctx) return;
    if (trendChart) trendChart.destroy();
    var labels = data.map(function (d) { return d.date.slice(5); });
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: '活跃用户', data: data.map(function(d){return d.activeUsers}), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
          { label: '学习时长(h)', data: data.map(function(d){return Math.round(d.studyTime/60*10)/10}), borderColor: '#f26b4f', backgroundColor: 'rgba(242,107,79,0.1)', fill: true, tension: 0.4, yAxisID: 'y1' },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, y1: { position: 'right', beginAtZero: true, grid: { display: false } } },
        interaction: { intersect: false, mode: 'index' }
      }
    });
    ctx.parentElement.style.height = '260px';
  }

  function renderSiteChart(sites) {
    var ctx = $('siteChart'); if (!ctx) return;
    if (siteChart) siteChart.destroy();
    var colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#2b8c88'];
    siteChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sites.map(function(s){return s.name}),
        datasets: [{ data: sites.map(function(_,i){return 100-(i*20)}), backgroundColor: colors.slice(0,sites.length), borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } } }
    });
    ctx.parentElement.style.height = '260px';
  }

  function renderRecentRecords(records) {
    var tbody = $('recentRecords'); if (!tbody) return;
    if (!records || !records.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-inbox"></i><p style="font-weight:600;">暂无学习记录</p><p style="font-size:12px;color:var(--muted);">用户开始学习后，记录将显示在这里</p></td></tr>'; return; }
    tbody.innerHTML = records.map(function (r) {
      return '<tr><td><div class="user-cell"><div class="user-avatar-sm">'+esc((r.displayName||r.username).charAt(0).toUpperCase())+'</div><span>'+esc(r.displayName||r.username)+'</span></div></td><td>'+esc(r.section||'未知')+'</td><td>'+(r.time||0)+'分钟</td><td>'+esc(r.date||'未知')+'</td></tr>';
    }).join('');
  }

  // ==================== 用户管理 ====================
  async function loadUsers() {
    try {
      var res = await fetch('/api/admin/users'), data = await res.json();
      if (data.success) { allUsers = data.users || []; renderUsersPage(1); }
    } catch (e) { showToast('加载用户列表失败', 'error'); }
  }

  function renderUsersPage(page) {
    currentPage = page;
    var q = ($('userSearchInput').value || '').toLowerCase().trim();
    var filtered = q ? allUsers.filter(function (u) { return (u.username||'').toLowerCase().indexOf(q)!==-1||(u.displayName||'').toLowerCase().indexOf(q)!==-1||(u.role||'').indexOf(q)!==-1; }) : allUsers;
    var totalPages = Math.ceil(filtered.length / pageSize) || 1;
    var start = (page - 1) * pageSize;
    var pageUsers = filtered.slice(start, start + pageSize);

    var tbody = $('usersTableBody'); if (!tbody) return;
    if (!pageUsers.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-users"></i><p style="font-weight:600;">暂无用户数据</p></td></tr>'; $('userPagination').innerHTML = ''; $('batchBar').classList.remove('show'); return; }

    tbody.innerHTML = pageUsers.map(function (u) {
      var isAdmin = u.role === '管理员';
      var sites = (u.allowedSites||[]).map(function(k){return '<span class="badge badge-info" style="margin:1px;">'+esc(k)+'</span>';}).join(' ') || '<span style="color:var(--muted);">-</span>';
      var checked = selectedUsers.has(u.username) ? 'checked' : '';
      return '<tr class="'+(selectedUsers.has(u.username)?'selected':'')+'" data-username="'+esc(u.username)+'">'+
        '<td><input type="checkbox" class="user-checkbox" '+checked+' onchange="AdminUI.toggleUserSelect(\''+esc(u.username)+'\',this.checked)" onclick="event.stopPropagation()"></td>'+
        '<td onclick="AdminUI.showUserDetail(\''+esc(u.username)+'\')" style="cursor:pointer;"><div class="user-cell"><div class="user-avatar-sm">'+esc((u.displayName||u.username).charAt(0).toUpperCase())+'</div><div><div style="font-weight:600">'+esc(u.displayName||u.username)+'</div><div style="font-size:12px;color:var(--muted);">@'+esc(u.username)+'</div></div></div></td>'+
        '<td><span class="badge '+(isAdmin?'badge-warning':'badge-info')+'">'+(isAdmin?'<i class="fas fa-crown" style="margin-right:4px;"></i>':'')+esc(u.role||'学习者')+'</span></td>'+
        '<td>'+(u.createdAt?new Date(u.createdAt).toLocaleDateString():'未知')+'</td><td>'+sites+'</td>'+
        '<td><div class="action-btns">'+
        '<button class="action-btn success" title="查看详情" onclick="AdminUI.showUserDetail(\''+esc(u.username)+'\')"><i class="fas fa-eye"></i></button>'+
        '<button class="action-btn" title="编辑" onclick="AdminUI.editUser(\''+esc(u.username)+'\')"><i class="fas fa-edit"></i></button>'+
        '<button class="action-btn" title="重置密码" onclick="AdminUI.resetUserPassword(\''+esc(u.username)+'\')"><i class="fas fa-key"></i></button>'+
        '<button class="action-btn danger" title="删除" onclick="AdminUI.deleteUser(\''+esc(u.username)+'\')"><i class="fas fa-trash"></i></button>'+
        '</div></td></tr>';
    }).join('');

    // 分页
    var pagHtml = '<button '+(page<=1?'disabled':'')+' onclick="AdminUI.renderUsersPage('+(page-1)+')"><i class="fas fa-chevron-left"></i></button>';
    for (var i = 1; i <= totalPages; i++) {
      if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - page) > 1) { if (i === 3) pagHtml += '<span class="page-info">...</span>'; continue; }
      pagHtml += '<button class="'+(i===page?'active':'')+'" onclick="AdminUI.renderUsersPage('+i+')">'+i+'</button>';
    }
    pagHtml += '<button '+(page>=totalPages?'disabled':'')+' onclick="AdminUI.renderUsersPage('+(page+1)+')"><i class="fas fa-chevron-right"></i></button>';
    pagHtml += '<span class="page-info">共 '+filtered.length+' 条</span>';
    $('userPagination').innerHTML = pagHtml;
    $('batchBar').classList.add('show');
    $('selectAll').checked = false;
  }

  function filterUsers(query) { renderUsersPage(1); }
  function toggleUserSelect(username, checked) {
    if (checked) selectedUsers.add(username); else selectedUsers.delete(username);
    $('batchCount').textContent = '已选 ' + selectedUsers.size + ' 项';
    $('selectAll').checked = selectedUsers.size > 0 && selectedUsers.size === allUsers.length;
    renderUsersPage(currentPage); // refresh selection state
  }
  function toggleSelectAll(checked) {
    selectedUsers.clear();
    if (checked) allUsers.forEach(function (u) { selectedUsers.add(u.username); });
    $('batchCount').textContent = '已选 ' + selectedUsers.size + ' 项';
    renderUsersPage(currentPage);
  }
  async function batchDelete() {
    if (!selectedUsers.size) return;
    showConfirmModal({ title: '批量删除', message: '确定要删除选中的 <strong>' + selectedUsers.size + '</strong> 个用户吗？', confirmText: '删除', confirmClass: 'danger',
      onConfirm: async function () {
        var arr = Array.from(selectedUsers);
        var failed = [];
        for (var i = 0; i < arr.length; i++) {
          try {
            var r = await fetch('/api/admin/users/' + arr[i], { method: 'DELETE' });
            var data = await r.json().catch(function () { return {}; });
            if (!data.success) failed.push(arr[i] + ': ' + (data.error || '未知错误'));
          } catch (e) {
            failed.push(arr[i] + ': 网络错误');
          }
        }
        selectedUsers.clear();
        if (failed.length > 0) {
          showToast('删除完成，' + failed.length + ' 个失败: ' + failed.join(', '), 'error');
        } else {
          showToast('批量删除成功', 'success');
        }
        loadUsers();
      }
    });
  }
  async function batchResetPassword() {
    if (!selectedUsers.size) return;
    var pw = prompt('请输入新密码（至少6位）:'); if (!pw || pw.length < 6) { if (pw !== null) showToast('密码至少6位', 'error'); return; }
    var arr = Array.from(selectedUsers);
    for (var i = 0; i < arr.length; i++) { try { await fetch('/api/admin/users/' + arr[i] + '/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: pw }) }); } catch (e) {} }
    showToast('批量重置密码完成', 'success');
  }

  // ==================== 用户详情（模态框） ====================
  async function showUserDetail(username) {
    $('detailBody').innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--accent);"></i><p style="margin-top:12px;color:var(--muted);">加载中...</p></div>';
    $('detailModal').classList.add('show');
    try {
      var res = await fetch('/api/admin/users/' + username + '/detail'), data = await res.json();
      if (!data.success) { showToast('获取详情失败', 'error'); $('detailModal').classList.remove('show'); return; }
      var d = data.detail;
      var badges = (d.badges||[]).map(function(b){return '<span class="badge-icon" title="'+esc(b.name||b)+'">'+(b.icon||'🏅')+'</span>';}).join(' ') || '<span style="color:var(--muted);font-size:13px;">暂无徽章</span>';
      var activity = (d.recentActivity||[]).length
        ? d.recentActivity.map(function(a){return '<div class="activity-item"><span class="section-name">'+esc(a.section)+'</span><span class="section-time">'+a.time+'分钟</span></div>';}).join('')
        : '<span style="color:var(--muted);font-size:13px;">暂无活动记录</span>';
      var isAdmin = d.role === '管理员';

      $('detailBody').innerHTML =
        '<div class="user-detail-header">'+
        '<div class="user-detail-avatar">'+esc((d.displayName||d.username).charAt(0).toUpperCase())+'</div>'+
        '<div class="user-detail-meta"><h2>'+esc(d.displayName||d.username)+'</h2><p>@'+esc(d.username)+' · '+(isAdmin?'<span class="badge badge-warning"><i class="fas fa-crown" style="margin-right:4px;"></i>'+esc(d.role)+'</span>':'<span class="badge badge-info">'+esc(d.role)+'</span>')+' · '+esc(d.email||'未设置邮箱')+'</p></div>'+
        '</div>'+
        '<div class="detail-grid">'+
        '<div class="detail-section"><h4>基本信息</h4>'+
        '<div class="detail-row"><span class="label">注册时间</span><span class="value">'+(d.createdAt?new Date(d.createdAt).toLocaleDateString():'未知')+'</span></div>'+
        '<div class="detail-row"><span class="label">可用站点</span><span class="value">'+(d.allowedSites||[]).map(function(k){return '<span class="badge badge-info" style="margin:1px;">'+esc(k)+'</span>';}).join(' ')+'</span></div>'+
        '<div class="detail-row"><span class="label">最近学习</span><span class="value">'+esc(d.stats.lastStudyDate||'从未')+'</span></div>'+
        '</div>'+
        '<div class="detail-section"><h4>学习统计</h4>'+
        '<div class="detail-row"><span class="label">总学习时长</span><span class="value">'+d.stats.totalStudyTime+' 分钟</span></div>'+
        '<div class="detail-row"><span class="label">连续学习</span><span class="value">'+d.stats.streak+' 天</span></div>'+
        '<div class="detail-row"><span class="label">累计天数</span><span class="value">'+d.stats.totalDays+' 天</span></div>'+
        '<div class="detail-row"><span class="label">经验值</span><span class="value">'+d.stats.exp+' (Lv.'+d.stats.level+')</span></div>'+
        '</div>'+
        '</div>'+
        '<div class="detail-section" style="margin-top:20px;"><h4>学习进度</h4>'+
        '<div class="progress-label"><span>已完成章节</span><span>'+d.stats.completedSections+' / '+d.stats.totalSections+' ('+d.stats.completionRate+'%)</span></div>'+
        '<div class="progress-bar"><div class="progress-fill" style="width:'+d.stats.completionRate+'%"></div></div>'+
        '</div>'+
        '<div class="detail-section" style="margin-top:20px;"><h4>徽章 ('+(d.badges||[]).length+')</h4>'+badges+'</div>'+
        '<div class="detail-section" style="margin-top:20px;"><h4>最近活动</h4>'+activity+'</div>';
    } catch (e) { showToast('获取详情失败', 'error'); $('detailModal').classList.remove('show'); }
  }
  function closeDetail() { $('detailModal').classList.remove('show'); }

  // ==================== 用户 CRUD ====================
  function openUserModal(user) {
    var m = $('userModal'), title = $('userModalTitle');
    $('editUserId').value = user ? user.username : '';
    $('userUsername').value = user ? user.username : '';
    $('userDisplayName').value = user ? (user.displayName||'') : '';
    $('userEmail').value = user ? (user.email||'') : '';
    $('userPassword').value = '';
    $('userRole').value = user ? (user.role||'学习者') : '学习者';
    title.innerHTML = user ? '<i class="fas fa-user-edit"></i> 编辑用户' : '<i class="fas fa-user-plus"></i> 添加用户';
    $('userUsername').disabled = !!user;
    m.classList.add('show');
  }
  function closeUserModal() { $('userModal').classList.remove('show'); }
  function closeSiteModal() { $('siteModal').classList.remove('show'); }

  async function saveUser() {
    var userId = $('editUserId').value, username = $('userUsername').value.trim(), displayName = $('userDisplayName').value.trim();
    var email = $('userEmail').value.trim(), password = $('userPassword').value, role = $('userRole').value;
    if (!userId && !username) { showToast('请输入用户名', 'error'); return; }
    if (!userId && !password) { showToast('请输入密码', 'error'); return; }
    $('saveUserBtn').disabled = true;
    try {
      var body = { displayName: displayName, role: role, email: email };
      if (password && password.length >= 6) body.password = password;
      var res = userId
        ? await fetch('/api/admin/users/' + userId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username, password: password, displayName: displayName, role: role, email: email }) });
      var data = await res.json();
      if (data.success) { showToast(userId ? '更新成功' : '创建成功', 'success'); closeUserModal(); loadUsers(); }
      else showToast(data.error || '操作失败', 'error');
    } catch (e) { showToast('操作失败', 'error'); }
    finally { $('saveUserBtn').disabled = false; }
  }

  async function editUser(username) {
    try { var res = await fetch('/api/admin/users/' + username), data = await res.json(); if (data.success) openUserModal(data.user); } catch (e) {}
  }
  async function resetUserPassword(username) {
    var pw = prompt('请输入新密码（至少6位）:'); if (!pw || pw.length < 6) { if (pw !== null) showToast('密码至少6位', 'error'); return; }
    try { var r = await fetch('/api/admin/users/' + username + '/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: pw }) }); if ((await r.json()).success) showToast('密码重置成功', 'success'); } catch (e) { showToast('重置失败', 'error'); }
  }
  async function deleteUser(username) {
    showConfirmModal({ title: '删除用户', message: '确定要删除用户 <strong>'+esc(username)+'</strong> 吗？<br>该用户的所有学习数据将被永久删除。', confirmText: '删除', confirmClass: 'danger',
      onConfirm: async function () {
        try {
          var r = await fetch('/api/admin/users/' + username, { method: 'DELETE' });
          var data = await r.json().catch(function () { return {}; });
          if (data.success) {
            showToast('删除成功', 'success');
            loadUsers();
          } else {
            showToast('删除失败: ' + (data.error || '未知错误'), 'error');
          }
        } catch (e) {
          showToast('删除失败: 网络错误，请检查服务器连接', 'error');
        }
      }
    });
  }

  // ==================== 内容管理 ====================
  async function loadContent() {
    var container = $('contentTreeBody'); if (!container) return;
    container.innerHTML = '<div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div>';
    try {
      var res = await fetch('/api/admin/content'), data = await res.json();
      if (data.success) { allContent = data.content || []; renderContentTree(allContent, container); }
      else container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>加载失败</p></div>';
      var cntBadge = document.querySelector('[data-tab="content"] .nav-badge');
      if (cntBadge) cntBadge.textContent = allContent.reduce(function(s,site){return s+(site.chapters||[]).length;},0);
    } catch (e) { container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>加载失败</p></div>'; }
  }

  function renderContentTree(sites, container) {
    if (!sites || !sites.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p style="font-weight:600;">暂无内容</p><p style="font-size:12px;color:var(--muted);">在 knowledge/ 目录下添加 Markdown 文件后刷新即可</p></div>'; return; }
    var totalSections = 0;
    var html = '<div class="content-tree">';
    sites.forEach(function (site) {
      var sectionCount = (site.chapters||[]).reduce(function(s,c){return s+(c.sections||1);},0); totalSections += sectionCount;
      html += '<div class="tree-item folder" onclick="AdminUI.toggleTree(this)"><i class="fas fa-folder"></i><span style="font-weight:600">'+esc(site.name)+'</span><span class="tree-count">'+(site.chapters||[]).length+'章 / '+sectionCount+'节</span><i class="fas fa-chevron-down tree-arrow"></i></div><div class="tree-children">';
      (site.chapters||[]).forEach(function (ch) {
        html += '<div class="tree-item file"><i class="fas fa-file-alt"></i><span>'+esc(ch.name)+'</span></div>';
      });
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function toggleTree(el) {
    var children = el.nextElementSibling, icon = el.querySelector('.tree-arrow');
    if (children) { children.style.display = children.style.display === 'none' ? 'block' : 'none'; if (icon) icon.className = children.style.display === 'none' ? 'fas fa-chevron-right tree-arrow' : 'fas fa-chevron-down tree-arrow'; }
  }

  function filterContent(query) {
    var q = (query||'').toLowerCase().trim(); var container = $('contentTreeBody');
    if (!q) { renderContentTree(allContent, container); return; }
    var filtered = allContent.map(function(site){ return { key:site.key, name:site.name, chapters:(site.chapters||[]).filter(function(ch){return ch.name.toLowerCase().indexOf(q)!==-1;}) }; }).filter(function(s){return s.chapters.length>0;});
    renderContentTree(filtered, container);
  }

  // ==================== 站点管理 ====================
  async function loadSites() {
    var tbody = $('sitesTableBody'); if (!tbody) return;
    try {
      var res = await fetch('/api/admin/sites'), data = await res.json();
      if (data.success) { allSites = data.sites || []; renderSites(allSites, tbody); }
    } catch (e) {}
  }
  function renderSites(sites, tbody) {
    if (!sites || !sites.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-globe"></i><p style="font-weight:600;">暂无站点数据</p></td></tr>'; return; }
    tbody.innerHTML = sites.map(function (s) {
      return '<tr><td><div class="user-cell"><div style="width:32px;height:32px;border-radius:6px;background:'+esc(s.theme||'#6366f1')+';display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;"><i class="fas fa-globe"></i></div><span style="font-weight:600">'+esc(s.name)+'</span></div></td>'+
      '<td><code style="background:var(--bg);padding:3px 8px;border-radius:4px;">'+esc(s.key)+'</code></td>'+
      '<td><span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:'+esc(s.theme||'#6366f1')+';"></span></td>'+
      '<td>'+esc(s.subtitle||'-')+'</td><td>'+esc(s.targetDate||'-')+'</td>'+
      '<td><div class="action-btns"><button class="action-btn" title="编辑" onclick="AdminUI.editSite(\''+esc(s.key)+'\')"><i class="fas fa-edit"></i></button><button class="action-btn danger" title="删除" onclick="AdminUI.deleteSite(\''+esc(s.key)+'\')"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('');
  }
  function openSiteModal(site) {
    var m = $('siteModal');
    $('editSiteKey').value = site ? site.key : '';
    $('siteName').value = site ? site.name : '';
    $('siteKey').value = site ? site.key : '';
    $('siteSubtitle').value = site ? (site.subtitle||'') : '';
    $('siteTheme').value = site ? (site.theme||'#6366f1') : '#6366f1';
    $('siteKey').disabled = !!site;
    m.classList.add('show');
  }
  async function saveSite() {
    var key = $('editSiteKey').value, name = $('siteName').value.trim(), siteKey = $('siteKey').value.trim();
    var subtitle = $('siteSubtitle').value.trim(), theme = $('siteTheme').value;
    if (!name || !siteKey) { showToast('请填写完整信息', 'error'); return; }
    $('saveSiteBtn').disabled = true;
    try {
      var url = key ? '/api/admin/sites/' + key : '/api/admin/sites';
      var res = await fetch(url, { method: key ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, key: siteKey, subtitle: subtitle, theme: theme }) });
      var data = await res.json();
      if (data.success) { showToast(key ? '更新成功' : '创建成功', 'success'); closeSiteModal(); loadSites(); }
      else showToast(data.error || '操作失败', 'error');
    } catch (e) { showToast('操作失败', 'error'); }
    finally { $('saveSiteBtn').disabled = false; }
  }
  async function editSite(key) { try { var r = await fetch('/api/admin/sites/' + key), d = await r.json(); if (d.success) openSiteModal(d.site); } catch (e) {} }
  async function deleteSite(key) {
    showConfirmModal({ title: '删除站点', message: '确定要删除站点 <strong>'+esc(key)+'</strong> 吗？', confirmText: '删除', confirmClass: 'danger',
      onConfirm: async function () { try { var r = await fetch('/api/admin/sites/' + key, { method: 'DELETE' }); if ((await r.json()).success) { showToast('删除成功', 'success'); loadSites(); } } catch (e) { showToast('删除失败', 'error'); } }
    });
  }

  // ==================== 系统设置 ====================
  async function loadSettings() {
    // 系统状态
    try {
      var res = await fetch('/api/admin/system-status'), data = await res.json();
      if (data.success) {
        var s = data.status;
        $('systemStatus').innerHTML =
          '<div class="status-item"><div class="label">数据库大小</div><div class="value">'+s.dbSize+' KB</div></div>'+
          '<div class="status-item"><div class="label">Node.js</div><div class="value">'+esc(s.nodeVersion)+'</div></div>'+
          '<div class="status-item"><div class="label">运行时间</div><div class="value">'+Math.floor(s.uptime/3600)+'h '+Math.floor(s.uptime%3600/60)+'m</div></div>'+
          '<div class="status-item"><div class="label">平台</div><div class="value">'+esc(s.platform)+'</div></div>'+
          '<div class="status-item"><div class="label">备份数量</div><div class="value">'+(s.backups||[]).length+' 个</div></div>'+
          '<div class="status-item"><div class="label">备份列表</div><div class="value" style="font-size:12px;">'+(s.backups||[]).map(function(b){return esc(b.name)+' ('+Math.round(b.size/1024)+'KB)';}).join('<br>')+'</div></div>';
      }
    } catch (e) {}
    // 审计日志
    try {
      var res2 = await fetch('/api/admin/audit-log?limit=20'), data2 = await res2.json();
      if (data2.success) {
        $('auditLogBody').innerHTML = (data2.logs||[]).length
          ? data2.logs.map(function(l){return '<tr><td>'+esc(l.created_at)+'</td><td>'+esc(l.username)+'</td><td>'+esc(l.action)+'</td><td>'+esc(l.detail)+'</td></tr>';}).join('')
          : '<tr><td colspan="4" class="empty-state"><i class="fas fa-history"></i><p>暂无操作日志</p></td></tr>';
      }
    } catch (e) {}
  }

  // ==================== 知识编辑 ====================
  var currentKnowledgeSite = 'c', currentChapterName = '', currentFileName = '';

  async function loadKnowledgeChapters() {
    currentKnowledgeSite = $('knowledgeSite').value;
    var container = $('knowledgeChapterList'); if (!container) return;
    container.innerHTML = '<div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div>';
    try {
      var res = await fetch('/api/admin/knowledge/' + currentKnowledgeSite), data = await res.json();
      if (!data.success) return;
      container.innerHTML = '';
      (data.chapters||[]).forEach(function(ch) {
        var chDiv = document.createElement('div');
        chDiv.className = 'tree-item folder';
        chDiv.innerHTML = '<i class="fas fa-folder"></i><span style="font-weight:600;">'+esc(ch.title)+'</span><span class="tree-count">'+(ch.sections||[]).length+'节</span><i class="fas fa-chevron-right tree-arrow"></i>';
        var children = document.createElement('div'); children.className = 'tree-children';
        (ch.sections||[]).forEach(function(sec) {
          var secDiv = document.createElement('div');
          secDiv.className = 'tree-item file';
          secDiv.innerHTML = '<i class="fas fa-file-alt"></i><span>'+esc(sec.title)+'</span>';
          secDiv.style.cursor = 'pointer';
          secDiv.addEventListener('click', function() { loadKnowledgeFile(ch.name, sec.name); });
          var actions = document.createElement('div'); actions.style.cssText = 'margin-left:auto;display:flex;gap:4px;';
          var delBtn = document.createElement('button');
          delBtn.className = 'action-btn danger'; delBtn.innerHTML = '<i class="fas fa-trash"></i>';
          delBtn.title = '删除'; delBtn.style.width = '28px'; delBtn.style.height = '28px';
          delBtn.addEventListener('click', function(e) { e.stopPropagation(); deleteKnowledgeFile(ch.name, sec.name); });
          actions.appendChild(delBtn);
          secDiv.appendChild(actions);
          children.appendChild(secDiv);
        });
        var addBtn = document.createElement('div');
        addBtn.className = 'tree-item'; addBtn.style.cssText = 'color:var(--accent);font-size:12px;cursor:pointer;';
        addBtn.innerHTML = '<i class="fas fa-plus"></i><span>新建小节</span>';
        addBtn.addEventListener('click', function() { showAddSectionModal(ch.name); });
        children.appendChild(addBtn);
        chDiv.addEventListener('click', function() { AdminUI.toggleTree(chDiv); });
        container.appendChild(chDiv); container.appendChild(children);
      });
    } catch (e) { container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation"></i><p>加载失败</p></div>'; }
  }

  async function loadKnowledgeFile(chapterName, fileName) {
    currentChapterName = chapterName; currentFileName = fileName;
    $('knowledgeEditTitle').textContent = fileName.replace(/^\d+[-_]*/, '').replace('.md', '');
    $('knowledgeEditor').value = '加载中...';
    $('knowledgeSaveBtn').disabled = true;
    try {
      var res = await fetch('/api/admin/knowledge/' + currentKnowledgeSite + '/' + encodeURIComponent(chapterName) + '/' + encodeURIComponent(fileName));
      var data = await res.json();
      if (data.success) { $('knowledgeEditor').value = data.content; $('knowledgeSaveBtn').disabled = false; }
      else showToast('加载失败', 'error');
    } catch (e) { showToast('加载失败', 'error'); }
  }

  async function saveKnowledgeFile() {
    if (!currentChapterName || !currentFileName) return;
    var content = $('knowledgeEditor').value;
    $('knowledgeSaveBtn').disabled = true;
    try {
      var res = await fetch('/api/admin/knowledge/' + currentKnowledgeSite + '/' + encodeURIComponent(currentChapterName) + '/' + encodeURIComponent(currentFileName), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: content })
      });
      if ((await res.json()).success) showToast('保存成功', 'success');
      else showToast('保存失败', 'error');
    } catch (e) { showToast('保存失败', 'error'); }
    $('knowledgeSaveBtn').disabled = false;
  }

  function toggleKnowledgePreview() {
    var previewPanel = $('knowledgePreviewPanel');
    var isShowing = previewPanel.classList.contains('show');
    if (isShowing) { previewPanel.classList.remove('show'); return; }
    previewPanel.classList.add('show');
    var md = $('knowledgeEditor').value;
    try { var html = marked.parse(md); $('knowledgePreviewContent').innerHTML = html; } catch (e) { $('knowledgePreviewContent').innerHTML = '<p style="color:var(--danger);">解析失败</p>'; }
  }

  async function deleteKnowledgeFile(chapterName, fileName) {
    showConfirmModal({ title: '删除文件', message: '确定删除 <strong>'+esc(fileName)+'</strong> 吗？', confirmText: '删除', confirmClass: 'danger',
      onConfirm: async function() {
        try { await fetch('/api/admin/knowledge/' + currentKnowledgeSite + '/' + encodeURIComponent(chapterName) + '/' + encodeURIComponent(fileName), { method: 'DELETE' }); showToast('删除成功', 'success'); loadKnowledgeChapters(); } catch (e) { showToast('删除失败', 'error'); }
      }
    });
  }

  function showAddChapterModal() {
    $('chapterModalTitle').innerHTML = '<i class="fas fa-folder-plus"></i> 新建章节';
    $('chapterNameInput').value = '';
    $('chapterNameInput').placeholder = '如：15_新章节';
    $('chapterModal').classList.add('show');
    $('saveChapterBtn').onclick = async function() {
      var name = $('chapterNameInput').value.trim(); if (!name) return showToast('请输入名称', 'error');
      try {
        var res = await fetch('/api/admin/knowledge/' + currentKnowledgeSite, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chapterName: name }) });
        if ((await res.json()).success) { showToast('创建成功', 'success'); $('chapterModal').classList.remove('show'); loadKnowledgeChapters(); }
      } catch (e) { showToast('创建失败', 'error'); }
    };
  }

  function showAddSectionModal(chapterName) {
    $('chapterModalTitle').innerHTML = '<i class="fas fa-file-plus"></i> 新建小节';
    $('chapterNameInput').value = '';
    $('chapterNameInput').placeholder = '如：01_小节名称.md';
    $('chapterModal').classList.add('show');
    $('saveChapterBtn').onclick = async function() {
      var name = $('chapterNameInput').value.trim(); if (!name) return showToast('请输入名称', 'error');
      try {
        var res = await fetch('/api/admin/knowledge/' + currentKnowledgeSite + '/' + encodeURIComponent(chapterName), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: name }) });
        if ((await res.json()).success) { showToast('创建成功', 'success'); $('chapterModal').classList.remove('show'); loadKnowledgeChapters(); }
      } catch (e) { showToast('创建失败', 'error'); }
    };
  }

  function closeChapterModal() { $('chapterModal').classList.remove('show'); }

  // ==================== 拓展管理 ====================
  async function loadExtensions() {
    var tbody = $('extensionTableBody'); if (!tbody) return;
    try {
      var res = await fetch('/api/extension'), data = await res.json();
      if (!data || !data.length) { tbody.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-file-word"></i><p style="font-weight:600;">暂无文档</p><p style="font-size:12px;color:var(--muted);">上传 .docx 或 .doc 文件</p></td></tr>'; return; }
      tbody.innerHTML = data.map(function(d) {
        return '<tr><td><div class="user-cell"><i class="fas fa-file-word" style="color:#2b579a;font-size:20px;"></i><span>'+esc(d.title)+'</span></div></td>'+
        '<td><span class="badge badge-info">'+(d.file.endsWith('.docx')?'DOCX':'DOC')+'</span></td>'+
        '<td><div class="action-btns"><button class="action-btn success" title="预览" onclick="AdminUI.previewExtension(\''+esc(d.id)+'\')"><i class="fas fa-eye"></i></button>'+
        '<button class="action-btn danger" title="删除" onclick="AdminUI.deleteExtension(\''+esc(d.id)+'\')"><i class="fas fa-trash"></i></button></div></td></tr>';
      }).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-exclamation"></i><p>加载失败</p></td></tr>'; }
  }

  async function uploadExtension() {
    var file = $('extensionFileInput').files[0]; if (!file) return;
    var formData = new FormData(); formData.append('file', file);
    try {
      var res = await fetch('/api/admin/extension/upload', { method: 'POST', body: formData });
      var data = await res.json();
      if (data.success) { showToast('上传成功', 'success'); loadExtensions(); }
      else showToast(data.error || '上传失败', 'error');
    } catch (e) { showToast('上传失败', 'error'); }
    $('extensionFileInput').value = '';
  }

  async function previewExtension(fileName) {
    var modal = $('detailModal'), body = $('detailBody');
    body.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--accent);"></i><p style="margin-top:12px;">加载预览...</p></div>';
    modal.classList.add('show');
    try {
      var res = await fetch('/api/admin/extension/preview/' + encodeURIComponent(fileName)), data = await res.json();
      if (data.success) body.innerHTML = '<div class="markdown-preview">'+data.html+'</div>';
      else body.innerHTML = '<p style="color:var(--danger);">预览失败</p>';
    } catch (e) { body.innerHTML = '<p style="color:var(--danger);">预览失败</p>'; }
  }

  async function deleteExtension(fileName) {
    showConfirmModal({ title: '删除文档', message: '确定删除 <strong>'+esc(fileName)+'</strong> 吗？', confirmText: '删除', confirmClass: 'danger',
      onConfirm: async function() {
        try { await fetch('/api/admin/extension/' + encodeURIComponent(fileName), { method: 'DELETE' }); showToast('删除成功', 'success'); loadExtensions(); } catch (e) { showToast('删除失败', 'error'); }
      }
    });
  }

  // ==================== 题库管理 ====================
  var currentQuizSite = 'c', currentQuizChapterId = '';

  async function loadQuizChapters() {
    currentQuizSite = $('quizSite').value;
    var container = $('quizChapterList'); if (!container) return;
    container.innerHTML = '<div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div>';
    try {
      var res = await fetch('/api/admin/quizzes/' + currentQuizSite), data = await res.json();
      if (!data.success) return;
      container.innerHTML = '';
      (data.chapters||[]).forEach(function(ch) {
        var div = document.createElement('div');
        div.className = 'tree-item file';
        div.innerHTML = '<i class="fas fa-list"></i><span>'+esc(ch.title||ch.chapterId)+'</span><span class="tree-count">'+(ch.questions||[]).length+'题</span>';
        div.style.cursor = 'pointer';
        div.addEventListener('click', function() {
          document.querySelectorAll('#quizChapterList .tree-item').forEach(function(d){d.style.background='';});
          div.style.background = 'var(--accent-light)';
          currentQuizChapterId = ch.chapterId;
          $('quizChapterTitle').textContent = ch.title || ch.chapterId;
          $('addQuestionBtn').disabled = false;
          renderQuizQuestions(ch.questions||[], ch.chapterId);
        });
        container.appendChild(div);
      });
    } catch (e) { container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation"></i><p>加载失败</p></div>'; }
  }

  function renderQuizQuestions(questions, chapterId) {
    var container = $('quizQuestionList'); if (!container) return;
    if (!questions.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-question"></i><p>暂无题目</p><p style="font-size:12px;color:var(--muted);">点击"添加题目"开始</p></div>'; return; }
    container.innerHTML = questions.map(function(q, i) {
      var opts = (q.options||[]).map(function(o, j) {
        return '<div class="quiz-option'+(j===q.correct?' correct':'')+'">'+
          '<span style="color:var(--muted);margin-right:8px;">'+String.fromCharCode(65+j)+'.</span>'+esc(o)+'</div>';
      }).join('');
      var diffLabel = ['','简单','中等','困难'][q.difficulty||1];
      var diffCls = q.difficulty===3?'badge-danger':q.difficulty===2?'badge-warning':'badge-success';
      return '<div class="quiz-card">'+
        '<div class="quiz-card-header"><h4>'+esc(q.question||'')+'</h4>'+
        '<div class="action-btns">'+
        '<button class="action-btn" title="编辑" onclick="AdminUI.editQuestion(\''+chapterId+'\','+i+')"><i class="fas fa-edit"></i></button>'+
        '<button class="action-btn danger" title="删除" onclick="AdminUI.deleteQuestion(\''+chapterId+'\','+i+')"><i class="fas fa-trash"></i></button>'+
        '</div></div>'+
        '<div class="quiz-card-body">'+opts+'</div>'+
        '<div class="quiz-footer">'+
        '<span class="badge '+diffCls+'">'+diffLabel+'</span>'+
        (q.explanation?'<span><i class="fas fa-info-circle"></i> '+esc(q.explanation)+'</span>':'')+
        '</div></div>';
    }).join('');
  }

  function showQuestionModal(chapterId, questionIndex) {
    var m = $('questionModal'), isEdit = typeof questionIndex !== 'undefined';
    $('questionModalTitle').innerHTML = isEdit ? '<i class="fas fa-edit"></i> 编辑题目' : '<i class="fas fa-plus"></i> 添加题目';
    $('editQuestionIndex').value = isEdit ? questionIndex : '';
    if (isEdit) {
      // Need to load question data from current state
      AdminUI._editChapterId = chapterId;
      $('questionText').value = '';
      $('optA').value = ''; $('optB').value = ''; $('optC').value = ''; $('optD').value = '';
      $('questionCorrect').value = '0'; $('questionDifficulty').value = '1'; $('questionExplanation').value = '';
      // Fetch current question data
      fetch('/api/admin/quizzes/' + currentQuizSite).then(function(r){return r.json();}).then(function(d){
        var ch = (d.chapters||[]).find(function(c){return c.chapterId === chapterId;});
        if (ch && ch.questions[questionIndex]) {
          var q = ch.questions[questionIndex];
          $('questionText').value = q.question || '';
          $('optA').value = (q.options||[])[0]||'';
          $('optB').value = (q.options||[])[1]||'';
          $('optC').value = (q.options||[])[2]||'';
          $('optD').value = (q.options||[])[3]||'';
          $('questionCorrect').value = q.correct||0;
          $('questionDifficulty').value = q.difficulty||1;
          $('questionExplanation').value = q.explanation||'';
        }
      });
    } else {
      $('questionText').value = ''; $('optA').value = ''; $('optB').value = ''; $('optC').value = ''; $('optD').value = '';
      $('questionCorrect').value = '0'; $('questionDifficulty').value = '1'; $('questionExplanation').value = '';
    }
    $('saveQuestionBtn').onclick = function() { saveQuestion(isEdit ? chapterId : null, isEdit ? questionIndex : null); };
    m.classList.add('show');
  }

  async function saveQuestion(editChapterId, editIndex) {
    var q = {
      question: $('questionText').value.trim(),
      options: [$('optA').value.trim(), $('optB').value.trim(), $('optC').value.trim(), $('optD').value.trim()],
      correct: parseInt($('questionCorrect').value),
      explanation: $('questionExplanation').value.trim(),
      difficulty: parseInt($('questionDifficulty').value)
    };
    if (!q.question) return showToast('请输入题目', 'error');
    var isEdit = typeof editIndex !== 'undefined';
    try {
      var url = isEdit
        ? '/api/admin/quizzes/' + currentQuizSite + '/' + encodeURIComponent(editChapterId) + '/' + editIndex
        : '/api/admin/quizzes/' + currentQuizSite;
      var res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { question: q } : { chapterId: currentQuizChapterId, question: q })
      });
      if ((await res.json()).success) { showToast(isEdit ? '更新成功' : '添加成功', 'success'); $('questionModal').classList.remove('show'); loadQuizChapters(); loadQuizQuestions(); }
      else showToast('操作失败', 'error');
    } catch (e) { showToast('操作失败', 'error'); }
  }

  function closeQuestionModal() { $('questionModal').classList.remove('show'); }

  function editQuestion(chapterId, index) { showQuestionModal(chapterId, index); }

  async function deleteQuestion(chapterId, index) {
    showConfirmModal({ title: '删除题目', message: '确定删除这道题目吗？', confirmText: '删除', confirmClass: 'danger',
      onConfirm: async function() {
        try { await fetch('/api/admin/quizzes/' + currentQuizSite + '/' + encodeURIComponent(chapterId) + '/' + index, { method: 'DELETE' }); showToast('删除成功', 'success'); loadQuizChapters(); loadQuizQuestions(); } catch (e) { showToast('删除失败', 'error'); }
      }
    });
  }

  function showAddQuizChapterModal() {
    $('chapterModalTitle').innerHTML = '<i class="fas fa-plus"></i> 新建题库章节';
    $('chapterNameInput').value = '';
    $('chapterNameInput').placeholder = '章节ID（如：06）';
    $('chapterModal').classList.add('show');
    $('saveChapterBtn').onclick = async function() {
      var id = $('chapterNameInput').value.trim(); if (!id) return showToast('请输入章节ID', 'error');
      try {
        var res = await fetch('/api/admin/quizzes/' + currentQuizSite + '/chapter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chapterId: id, title: id }) });
        if ((await res.json()).success) { showToast('创建成功', 'success'); $('chapterModal').classList.remove('show'); loadQuizChapters(); }
      } catch (e) { showToast('创建失败', 'error'); }
    };
  }

  async function loadQuizQuestions() {
    if (!currentQuizChapterId) return;
    try {
      var res = await fetch('/api/admin/quizzes/' + currentQuizSite), data = await res.json();
      if (data.success) { var ch = (data.chapters||[]).find(function(c){return c.chapterId===currentQuizChapterId;}); if (ch) renderQuizQuestions(ch.questions||[], ch.chapterId); }
    } catch (e) {}
  }

  // ==================== 暴露全局 ====================
  window.AdminUI = {
    switchTab: function (tabId) { document.querySelector('.nav-item[data-tab="'+tabId+'"]').click(); },
    renderUsersPage: renderUsersPage, filterUsers: filterUsers,
    showUserDetail: showUserDetail, closeDetail: closeDetail,
    editUser: editUser, resetUserPassword: resetUserPassword, deleteUser: deleteUser,
    toggleUserSelect: toggleUserSelect, toggleSelectAll: toggleSelectAll,
    batchDelete: batchDelete, batchResetPassword: batchResetPassword,
    openUserModal: openUserModal, closeUserModal: closeUserModal,
    editSite: editSite, deleteSite: deleteSite,
    openSiteModal: openSiteModal, closeSiteModal: closeSiteModal,
    toggleTree: toggleTree, filterContent: filterContent,
    closeConfirmModal: closeConfirmModal,
    // 知识编辑
    loadKnowledgeChapters: loadKnowledgeChapters, loadKnowledgeFile: loadKnowledgeFile,
    saveKnowledgeFile: saveKnowledgeFile, toggleKnowledgePreview: toggleKnowledgePreview,
    deleteKnowledgeFile: deleteKnowledgeFile, showAddChapterModal: showAddChapterModal,
    showAddSectionModal: showAddSectionModal, closeChapterModal: closeChapterModal,
    // 拓展管理
    loadExtensions: loadExtensions, uploadExtension: uploadExtension,
    previewExtension: previewExtension, deleteExtension: deleteExtension,
    // 题库管理
    loadQuizChapters: loadQuizChapters, showQuestionModal: showQuestionModal,
    closeQuestionModal: closeQuestionModal, editQuestion: editQuestion,
    deleteQuestion: deleteQuestion, showAddQuizChapterModal: showAddQuizChapterModal,
    loadQuizQuestions: loadQuizQuestions,
  };
})();