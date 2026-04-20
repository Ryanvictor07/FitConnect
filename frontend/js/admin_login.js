const API = 'http://127.0.0.1:8000/api/users';

    function togglePassword(btn) {
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁';
      }
    }

    function showError(msg) {
      const el = document.getElementById('error-msg');
      el.textContent = msg;
      el.classList.add('show');
    }

    function hideError() {
      document.getElementById('error-msg').classList.remove('show');
    }

    async function handleLogin(e) {
      e.preventDefault();
      hideError();

      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const btn      = document.getElementById('login-btn');

      if (!email || !password) {
        showError('Please fill in all fields.');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        const response = await fetch(`${API}/admin/login/`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        });

        const result = await response.json();

        
        if (response.ok) {
          localStorage.setItem('adminToken',   result.access);   // ✅ matches dashboard
          localStorage.setItem('adminRefresh', result.refresh);  // ✅ matches dashboard
          localStorage.setItem('adminUser',    JSON.stringify(result.user)); // ✅ matches dashboard
          btn.textContent = '✓ Redirecting...';
          setTimeout(() => window.location.href = 'admin_dashboard.html', 800);
        } else {
          const errors = Object.values(result).flat().join(' ');
          showError(errors || 'Invalid credentials. Please try again.');
          btn.disabled = false;
          btn.textContent = 'Login to Dashboard';
        }
      } catch (err) {
        showError('Cannot connect to server. Make sure Django is running.');
        btn.disabled = false;
        btn.textContent = 'Login to Dashboard';
      }
    }

    
    // Allow Enter key to submit
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin(e);
    });