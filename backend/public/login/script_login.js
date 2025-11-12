document.addEventListener('DOMContentLoaded', () => {
  // 綁定三個表單（如果頁面只有一個也沒關係）
  ['buyerForm', 'sellerForm', 'adminForm'].forEach(fid => {
    const form = document.getElementById(fid);
    if (form) form.addEventListener('submit', (e) => handleSubmit(e, fid));
  });
});

async function handleSubmit(event, formId) {
  event.preventDefault();

  const form = event.target;
  const msg = form.querySelector('.error-msg');

  // 依 formId 取得對應的輸入欄位 ID
  const userInput = form.querySelector(`#${formId.replace('Form', '')}Username`);
  const passInput = form.querySelector(`#${formId.replace('Form', '')}Password`);

  if (!userInput || !passInput) {
    console.error('找不到輸入欄位，請確認 input 的 id 是否為 adminUsername/adminPassword 等對應命名');
    if (msg) { msg.textContent = '欄位設定有誤，請聯絡開發者'; msg.style.display = 'block'; }
    return;
  }

  const username = userInput.value.trim();
  const password = passInput.value;

  if (!username || !password) {
    if (msg) { msg.textContent = '用戶名稱和密碼為必填項目！'; msg.style.display = 'block'; }
    return;
  }
  if (msg) msg.style.display = 'none';

  // 決定要打哪一條 API
  let url = '/api/login';
  if (formId === 'sellerForm') url = '/api/seller-login';
  if (formId === 'adminForm') url = '/api/admin-login';

  try {
    // 成功後儲存 token，導到 /admin/
    const resp = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.value, password: adminPass.value })
    });
    const data = await resp.json();
    if (resp.ok && data.token) {
      localStorage.setItem('token', data.token);
      location.href = '/admin/';
    } else {
      msg.textContent = data.error || '用戶名或密碼錯誤！';
      msg.style.display = 'block';
    }

  } catch (err) {
    console.error(err);
    if (msg) {
      msg.textContent = '登入時發生錯誤，請稍後再試。';
      msg.style.display = 'block';
    }
  }
}

