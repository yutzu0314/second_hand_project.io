// public/admin/script.js
function getToken() { return localStorage.getItem('token') || ''; }
function authHeaders() {
  const h = { 'Content-Type':'application/json' };
  const t = getToken(); if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

async function loadUsers() {
  const tb = document.querySelector('#usersTbl tbody');
  if (!tb) return;
  tb.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';
  try {
    const resp = await fetch('/api/users', { headers: authHeaders() });
    const users = await resp.json();
    tb.innerHTML = (users || []).map(u => `
      <tr>
        <td>${u.id ?? ''}</td>
        <td>${u.email ?? ''}</td>
        <td>${u.name ?? ''}</td>
        <td>${u.role ?? ''}</td>
        <td>${u.status ?? ''}</td>
        <td></td>
      </tr>
    `).join('');
  } catch (e) {
    tb.innerHTML = '<tr><td colspan="6">載入失敗</td></tr>';
  }
}

async function createUser() {
  const email = document.querySelector('#newEmail')?.value.trim();
  const pwd   = document.querySelector('#newPassword')?.value;
  const name  = document.querySelector('#newName')?.value.trim();
  const role  = document.querySelector('#newRole')?.value || 'buyer';
  const status= document.querySelector('#newStatus')?.value || 'active';
  if (!email || !pwd) return alert('Email / 密碼必填');

  const resp = await fetch('/api/users', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password: pwd, name, role, status })
  });
  if (resp.ok) {
    // 清空輸入、重載表格
    ['#newEmail','#newPassword','#newName'].forEach(sel => {
      const el = document.querySelector(sel); if (el) el.value = '';
    });
    await loadUsers();
  } else {
    const data = await resp.json().catch(()=> ({}));
    alert('新增失敗：' + (data.error || resp.status));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 顯示 token（純顯示用）
  const tokenBox = document.querySelector('#tokenInput');
  if (tokenBox) tokenBox.value = getToken();

  // 綁定按鈕
  document.querySelector('#btnLoadUsers')?.addEventListener('click', loadUsers);
  document.querySelector('#btnCreateUser')?.addEventListener('click', createUser);

  // 首次載入就撈一次
  loadUsers();
});
