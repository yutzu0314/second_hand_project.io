async function loadUsers() {
  const list = document.getElementById('userList');
  if (!list) return;

  try {
    const resp = await fetch('/api/users');  // 相對路徑
    const users = await resp.json();
    const base = ''; // 同網域
    function auth() {
      const t = localStorage.getItem('token') || '';
      return { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' };
    }

    list.innerHTML = users.map(u =>
      `<li>#${u.id} ${u.email} [${u.role}] ${new Date(u.created_at).toLocaleString()}</li>`
    ).join('');
  } catch (e) {
    list.innerHTML = '載入失敗';
  }
}

document.addEventListener('DOMContentLoaded', loadUsers);
