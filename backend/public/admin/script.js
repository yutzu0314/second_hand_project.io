// const API_BASE = 'http://localhost:3000/admin';

function getToken(){ return localStorage.getItem('token') || ''; }
function authHeaders(){
  const h = { 'Content-Type':'application/json' };
  const t = getToken(); if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

// === 全域快取（拿來做篩選、統計用） ===
let allUsers = [];
let allReports = [];
let currentRoleFilter = 'all';    // all / buyer / seller / admin

// ==================== 用戶清單＋統計卡片 ====================

async function loadUsers(){
  const tb = document.querySelector('#usersTbl tbody');
  if (!tb) return;
  tb.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';
  try{
    const resp = await fetch('/api/users', { headers: authHeaders() });
    if(!resp.ok) throw new Error('載入失敗');
    const users = await resp.json();

    allUsers = users || [];          // 存起來給篩選用
    updateUserStats(allUsers);       // 更新「有效/停權」卡片
    applyUserFilters();              // 根據目前 tabs / 搜尋 / 狀態 重新畫表

  }catch(e){
    console.error(e);
    tb.innerHTML = '<tr><td colspan="6">載入失敗</td></tr>';
  }
}

// 單純負責把某個陣列畫到 user table
function renderUsersTable(users){
  const tb = document.querySelector('#usersTbl tbody');
  if (!tb) return;

  if (!users || users.length === 0){
    tb.innerHTML = '<tr><td colspan="6">目前沒有資料</td></tr>';
    return;
  }

  tb.innerHTML = users.map(u => `
    <tr data-id="${u.id ?? ''}">
      <td>${u.id ?? ''}</td>
      <td>${u.email ?? ''}</td>
      <td>${u.name ?? ''}</td>
      <td>${u.role ?? ''}</td>
      <td>${u.status ?? ''}</td>
      <td class="ops">
        <button class="btn-edit">編輯</button>
        <button class="btn-toggle">
          ${u.status === 'active' ? '停權' : '恢復'}
        </button>
        <button class="btn-del">刪除</button>
      </td>
    </tr>
  `).join('');
}

// 根據「tabs、搜尋、狀態」過濾 allUsers 然後重畫表格
function applyUserFilters(){
  let list = allUsers.slice();

  // 1) 角色（全部/買家/賣家/管理員）
  if (currentRoleFilter !== 'all'){
    list = list.filter(u => u.role === currentRoleFilter);
  }

  // 2) 狀態下拉
  const statusSelect = document.querySelector('#userStatusFilter');
  const status = statusSelect ? statusSelect.value : 'all';
  if (status !== 'all'){
    list = list.filter(u => u.status === status);
  }

  // 3) 關鍵字（email / name）
  const searchInput = document.querySelector('#userSearchInput');
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
  if (keyword){
    list = list.filter(u => {
      const email = (u.email || '').toLowerCase();
      const name  = (u.name  || '').toLowerCase();
      return email.includes(keyword) || name.includes(keyword);
    });
  }

  renderUsersTable(list);
}

// 卡片：有效會員數 / 停權會員數
function updateUserStats(users){
  const active = users.filter(u => u.status === 'active').length;
  const suspended = users.filter(u => u.status === 'suspended').length;

  const elActive = document.getElementById('statActiveUsers');
  const elSusp  = document.getElementById('statSuspendedUsers');

  if (elActive) elActive.textContent = active;
  if (elSusp)  elSusp.textContent  = suspended;
}

// ==================== 新增使用者 ====================
async function createUser(){
  const btn   = document.querySelector('#btnCreateUser');
  const email = document.querySelector('#newEmail')?.value.trim();
  const pwd   = document.querySelector('#newPassword')?.value;
  const name  = document.querySelector('#newName')?.value.trim();
  const role  = document.querySelector('#newRole')?.value || 'buyer';
  const status= document.querySelector('#newStatus')?.value || 'active';
  if (!email || !pwd) return alert('Email / 密碼必填');

  // 防連點
  if (btn){ btn.disabled = true; btn.dataset._txt = btn.textContent; btn.textContent = '處理中...'; }

  try{
    const resp = await fetch('/api/users', {
      method:'POST', headers:authHeaders(),
      body: JSON.stringify({ email, password:pwd, name, role, status })
    });
    if (resp.ok){
      ['#newEmail','#newPassword','#newName'].forEach(sel => {
        const el = document.querySelector(sel); if (el) el.value = '';
      });
      await loadUsers();
    }else{
      const data = await resp.json().catch(()=> ({}));
      alert('新增失敗：' + (data.error || resp.status));
    }
  }finally{
    if (btn){ btn.disabled = false; btn.textContent = btn.dataset._txt || '新增使用者'; }
  }
}

// ==================== 用戶列上的按鈕（編輯/停權/刪除） ====================

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  // 只處理用戶表內的按鈕
  const tr = btn.closest('#usersTbl tbody tr');
  if (!tr) return;

  const id = Number(tr.dataset.id);
  if (!id) return;

  // 編輯（改 name/role/status）
  if (btn.classList.contains('btn-edit')) {
    const curName = tr.children[2].textContent.trim();
    const curRole = tr.children[3].textContent.trim();
    const curStat = tr.children[4].textContent.trim();

    const name = prompt('名稱（留空則不改）', curName) ?? '';
    const role = prompt('角色：buyer / seller / admin（留空不改）', curRole) ?? '';
    const status = prompt('狀態：active / suspended（留空不改）', curStat) ?? '';

    const payload = {};
    if (name.trim())   payload.name = name.trim();
    if (role.trim())   payload.role = role.trim();
    if (status.trim()) payload.status = status.trim();

    if (Object.keys(payload).length === 0) return;

    const resp = await fetch(`/api/users/${id}`, {
      method:'PATCH', headers: authHeaders(), body: JSON.stringify(payload)
    });
    if (resp.ok) { loadUsers(); }
    else { alert('更新失敗'); }
  }

  // 停權/恢復
  if (btn.classList.contains('btn-toggle')) {
    const to = tr.children[4].textContent.trim() === 'active' ? 'suspended' : 'active';
    const resp = await fetch(`/api/users/${id}`, {
      method:'PATCH', headers: authHeaders(), body: JSON.stringify({ status: to })
    });
    if (resp.ok) { loadUsers(); }
    else { alert('更新失敗'); }
  }

  // 刪除
  if (btn.classList.contains('btn-del')) {
    if (!confirm(`確認刪除使用者 #${id}？`)) return;
    const resp = await fetch(`/api/users/${id}`, {
      method:'DELETE', headers: authHeaders()
    });
    if (resp.ok) { loadUsers(); }
    else { alert('刪除失敗'); }
  }
});


// ==================== 檢舉清單 ====================

async function loadReports(){
  const tb = document.querySelector('#reportsTbl tbody');
  if (!tb) return;
  tb.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';
  try{
    const resp = await fetch('/api/reports?status=pending', { headers: authHeaders() });
    const rows = await resp.json();

    allReports = rows || [];
    updateReportStats(allReports);   // 更新「待處理檢舉」卡片
    renderReportsTable(allReports);  // 目前先不做篩選，只全部顯示

  }catch(e){
    console.error(e);
    tb.innerHTML = '<tr><td colspan="7">載入失敗</td></tr>';
  }
}

function renderReportsTable(rows){
  const tb = document.querySelector('#reportsTbl tbody');
  if (!tb) return;

  if (!rows || rows.length === 0){
    tb.innerHTML = '<tr><td colspan="7">目前沒有 pending 檢舉</td></tr>';
    return;
  }

  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.reporter_id}</td>
      <td>${r.target_type}:${r.target_id}</td>
      <td>${r.reason_code}</td>
      <td>${r.reason_text ?? ''}</td>
      <td>${r.status}</td>
      <td>
        <button class="btn-r" data-id="${r.id}" data-to="in_review">接案</button>
        <button class="btn-r" data-id="${r.id}" data-to="resolved">通過</button>
        <button class="btn-r" data-id="${r.id}" data-to="rejected">駁回</button>
      </td>
    </tr>
  `).join('');

  tb.querySelectorAll('.btn-r').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.dataset.id, to = b.dataset.to;
      const resp = await fetch(`/api/reports/${id}`, {
        method:'PATCH', headers: authHeaders(), body: JSON.stringify({ status: to })
      });
      if (resp.ok) loadReports(); else alert('更新失敗');
    });
  });
}

// 卡片：待處理檢舉
function updateReportStats(rows){
  const pending = rows.length;   // 你現在只抓 status=pending
  const el = document.getElementById('statPendingReports');
  if (el) el.textContent = pending;
}

// ==================== DOM Ready ====================

document.addEventListener('DOMContentLoaded', () => {
  const tokenBox = document.querySelector('#tokenInput');
  if (tokenBox) tokenBox.value = getToken();

  document.querySelector('#btnLoadUsers')?.addEventListener('click', loadUsers);
  document.querySelector('#btnCreateUser')?.addEventListener('click', createUser);
  document.querySelector('#btnLoadReports')?.addEventListener('click', loadReports);

  // --- 綁定角色 tabs ---
  document.querySelectorAll('[data-role-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRoleFilter = btn.dataset.role || 'all';

      // 切換 active 樣式
      document.querySelectorAll('[data-role-tab]').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');

      applyUserFilters();
    });
  });

  // --- 搜尋 & 狀態篩選 ---
  document.querySelector('#userSearchInput')?.addEventListener('input', () => {
    applyUserFilters();
  });

  document.querySelector('#userStatusFilter')?.addEventListener('change', () => {
    applyUserFilters();
  });

  // --- 登出 ---
  const btnLogout = document.querySelector('#btnLogout');
  if (btnLogout){
    btnLogout.addEventListener('click', () => {
      if (!confirm('確定要登出嗎？')) return;

      // 1. 清除 token
      localStorage.removeItem('token');

      // 2. 導回 login 頁面
      window.location.href = '/login'; // ← 換成你的 login 檔案位置
    });
  }

  // 一進頁就先載一次
  loadUsers();
  loadReports();
});
