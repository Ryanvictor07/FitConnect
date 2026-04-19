const API = 'http://127.0.0.1:8000/api/users';

function getToken() {
    return localStorage.getItem('access_token');
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
    };
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.style.display = 'block';
}

function hideError(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

function showSuccess(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.style.display = 'block';
}

function togglePw(btn) {
  const input = btn.previousElementSibling;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

    async function handleRegister() {
      const errEl  = document.getElementById('error-msg');
      const sucEl  = document.getElementById('success-msg');
      errEl.classList.remove('show');
      sucEl.classList.remove('show');

      const btn = document.getElementById('reg-btn');
      const data = {
        first_name: document.getElementById('first_name').value,
        last_name:  document.getElementById('last_name').value,
        username:   document.getElementById('username').value,
        email:      document.getElementById('email').value,
        phone:      document.getElementById('phone').value,
        birthdate:  document.getElementById('birthdate').value,
        address:    document.getElementById('address').value,
        password:   document.getElementById('password').value,
      };

      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        const response = await fetch(`${API}/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
          localStorage.setItem('access_token',  result.access);
          localStorage.setItem('refresh_token', result.refresh);
          sucEl.textContent = 'Registration successful! Redirecting...';
          sucEl.classList.add('show');
          btn.textContent = '✓ Success!';
          setTimeout(() => window.location.href = 'application.html', 1500);
        } else {
          const errors = Object.values(result).flat().join(' ');
          errEl.textContent = errors;
          errEl.classList.add('show');
          btn.disabled = false;
          btn.textContent = 'Create My Account';
        }
      } catch {
        errEl.textContent = 'Cannot connect to server.';
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Create My Account';
      }
    }



    function togglePw(btn) {
      const input = btn.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁' : '🙈';
    }

    async function handleLogin() {
      const errEl = document.getElementById('error-msg');
      errEl.classList.remove('show');

      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const btn      = document.getElementById('login-btn');

      if (!email || !password) {
        errEl.textContent = 'Please fill in all fields.';
        errEl.classList.add('show'); return;
      }

      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        const response = await fetch(`${API}/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (response.ok) {
          localStorage.setItem('access_token',  result.access);
          localStorage.setItem('refresh_token', result.refresh);
          localStorage.setItem('user', JSON.stringify(result.user));
          btn.textContent = '✓ Redirecting...';
          setTimeout(() => window.location.href = 'status.html', 800);
        } else {
          errEl.textContent = result.non_field_errors?.[0] || 'Invalid email or password.';
          errEl.classList.add('show');
          btn.disabled = false;
          btn.textContent = 'Login to Account';
        }
      } catch {
        errEl.textContent = 'Cannot connect to server. Make sure Django is running.';
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Login to Account';
      }
    }

    document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  