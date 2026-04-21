const API   = 'http://127.0.0.1:8000/api/users';
  const token = localStorage.getItem('adminToken');

  if (!token) {
    window.location.href = 'admin_login.html';
  }

  // Hydrate sidebar
  const u = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Admin';
  document.getElementById('admin-name').textContent    = fullName;
  document.getElementById('admin-email').textContent   = u.email || '';
  document.getElementById('admin-avatar').textContent  = (u.first_name || 'A')[0].toUpperCase();
  document.getElementById('hero-name').textContent     = u.first_name || 'Admin';

  // — Helpers —
  function authHeaders() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className   = `show ${type}`;
    setTimeout(() => el.className = '', 3200);
  }

  function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function badgeStatus(s) {
    const map = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' };
    return `<span class="badge ${map[s] || ''}">${s}</span>`;
  }

  function closeModal(id) { document.getElementById(id).classList.remove('open'); }
  function openModal(id)  { document.getElementById(id).classList.add('open'); }

  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });

  // — Navigation —
  const pageTitles = {
    dashboard:    ['Dashboard',         'Overview'],
    applications: ['Applications',      'Membership Requests'],
    plans:        ['Membership Plans',  'Subscriptions'],
    trainers:     ['Personal Trainers', 'Coaching Team'],
  };

  let currentSection = 'dashboard';
  function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${name}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const keywords = { dashboard:'dashboard', applications:'application', plans:'plan', trainers:'trainer' };
    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.textContent.toLowerCase().includes(keywords[name])) n.classList.add('active');
    });
    const [title, crumb] = pageTitles[name] || ['—', '—'];
    document.getElementById('page-title').textContent      = title;
    document.getElementById('breadcrumb-label').textContent = crumb;
    currentSection = name;
    if (name === 'dashboard')    loadDashboard();
    if (name === 'applications') loadApplications();
    if (name === 'plans')        loadPlans();
    if (name === 'trainers')     loadTrainers();
  }

  // — Logout —
  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefresh');
    localStorage.removeItem('adminUser');
    window.location.href = 'admin_login.html';
  }

  // ─────────────────────────────────────────
  //  DASHBOARD
  // ─────────────────────────────────────────
  async function loadDashboard() {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '<div class="loading">Loading stats</div>';
    try {
      const res  = await fetch(`${API}/admin/dashboard/`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error();
      grid.innerHTML = `
        <div class="stat-card c-orange">
          <span class="stat-icon">👥</span>
          <div class="label">Total Members</div>
          <div class="value orange">${data.total_users}</div>
          <div class="stat-bar orange"></div>
        </div>
        <div class="stat-card c-yellow">
          <span class="stat-icon">⏳</span>
          <div class="label">Pending Apps</div>
          <div class="value yellow">${data.applications.pending}</div>
          <div class="stat-bar yellow"></div>
        </div>
        <div class="stat-card c-green">
          <span class="stat-icon">✅</span>
          <div class="label">Approved Apps</div>
          <div class="value green">${data.applications.approved}</div>
          <div class="stat-bar green"></div>
        </div>
        <div class="stat-card c-red">
          <span class="stat-icon">❌</span>
          <div class="label">Rejected Apps</div>
          <div class="value red">${data.applications.rejected}</div>
          <div class="stat-bar red"></div>
        </div>
        <div class="stat-card c-orange">
          <span class="stat-icon">📄</span>
          <div class="label">Active Plans</div>
          <div class="value orange">${data.active_plans}<span style="font-size:22px;opacity:0.4"> / ${data.total_plans}</span></div>
          <div class="stat-bar orange"></div>
        </div>
        <div class="stat-card c-green">
          <span class="stat-icon">🏋</span>
          <div class="label">Avail. Trainers</div>
          <div class="value green">${data.available_trainers}<span style="font-size:22px;opacity:0.4"> / ${data.total_trainers}</span></div>
          <div class="stat-bar green"></div>
        </div>
      `;
    } catch {
      grid.innerHTML = '<div class="loading">⚠️ Failed to load stats.</div>';
    }
  }

  // ─────────────────────────────────────────
  //  APPLICATIONS
  // ─────────────────────────────────────────
  let currentAppId = null;

  async function loadApplications() {
    const tbody  = document.getElementById('app-tbody');
    const filter = document.getElementById('app-filter').value;
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading</td></tr>';
    try {
      const url = `${API}/admin/applications/${filter ? '?status=' + filter : ''}`;
      const res  = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error();
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><span class="emoji">📋</span><p>No applications found.</p></div></td></tr>';
        return;
      }
      tbody.innerHTML = data.map(a => `
        <tr>
          <td style="color:var(--txt-dim)">#${a.id}</td>
          <td>${a.user_name || '—'}</td>
          <td style="color:var(--txt-dim)">${a.user_email}</td>
          <td>${a.plan_name || '—'}</td>
          <td style="color:var(--txt-dim)">${fmt(a.submitted_at)}</td>
          <td>${badgeStatus(a.status)}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="viewApplication(${a.id})">View</button>
            ${a.status === 'pending'
              ? `<button class="btn btn-primary btn-sm" style="margin-left:6px" onclick="openReview(${a.id},'${a.user_name}','${a.plan_name}')">Review</button>`
              : ''}
               ${a.status === "rejected"
             ? `<button class="btn btn-danger btn-sm" style="margin-left:6px" onclick="deleteApplication(${a.id})">Delete</button>`
             : ''
           }
          </td>
        </tr>
      `).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="7" class="loading">⚠️ Failed to load applications.</td></tr>';
    }
  }

  function openReview(id, name, plan) {
    currentAppId = id;
    document.getElementById('review-info').innerHTML = `<strong style="color:#fff">${name}</strong> &nbsp;·&nbsp; ${plan}`;
    document.getElementById('review-action').value    = 'approve';
    document.getElementById('rejection-reason').value = '';
    document.getElementById('rejection-wrap').style.display = 'none';
    openModal('modal-review');
  }

  function toggleRejectionReason() {
    const show = document.getElementById('review-action').value === 'reject';
    document.getElementById('rejection-wrap').style.display = show ? 'block' : 'none';
  }

  async function viewApplication(id) {
    try {
      const res = await fetch(`${API}/admin/applications/${id}/`, { headers: authHeaders() });
      const a   = await res.json();
      alert(
        `Application #${a.id}\n` +
        `Applicant : ${a.user_name} (${a.user_email})\n` +
        `Plan      : ${a.plan_name}\n` +
        `Status    : ${a.status}\n` +
        `Submitted : ${fmt(a.submitted_at)}\n` +
        `Reviewed  : ${fmt(a.reviewed_at)}\n` +
        `Rejection : ${a.rejection_reason || '—'}\n` +
        `Documents : ${a.documents?.length || 0} file(s)`
      );
    } catch {
      toast('Failed to fetch application details.', 'error');
    }
  }

  async function submitReview() {
    const action = document.getElementById('review-action').value;
    const reason = document.getElementById('rejection-reason').value;
    try {
      const res  = await fetch(`${API}/admin/applications/${currentAppId}/`, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify({ action, rejection_reason: reason }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Application ${action}d successfully! ✅`);
        closeModal('modal-review');
        loadApplications();
        loadDashboard();
      } else {
        const msg = data.rejection_reason?.[0] || data.error || 'Review failed.';
        toast(msg, 'error');
      }
    } catch { toast('Network error.', 'error'); }
  }

  // ─────────────────────────────────────────
  //  MEMBERSHIP PLANS
  // ─────────────────────────────────────────
  async function loadPlans() {
    const tbody = document.getElementById('plans-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading</td></tr>';
    try {
      const res  = await fetch(`${API}/admin/plans/`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error();
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><span class="emoji">📄</span><p>No plans yet.</p></div></td></tr>';
        return;
      }
      tbody.innerHTML = data.map(p => `
        <tr>
          <td style="color:var(--txt-dim)">#${p.id}</td>
          <td>${p.name}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--txt-dim)">${p.description || '—'}</td>
          <td style="color:var(--orange);font-weight:700">₱${parseFloat(p.price).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
          <td style="color:var(--txt-dim)">${p.duration} mo.</td>
          <td><span class="badge ${p.is_active ? 'badge-active' : 'badge-inactive'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openPlanModal(${p.id})">Edit</button>
            ${p.is_active
              ? `<button class="btn btn-danger btn-sm" style="margin-left:6px" onclick="deactivatePlan(${p.id})">Deactivate</button>`
              : ''}
          </td>
        </tr>
      `).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="7" class="loading">⚠️ Failed to load plans.</td></tr>';
    }
  }

  async function openPlanModal(id = null) {
    document.getElementById('plan-modal-title').textContent = id ? 'Edit Membership Plan' : 'New Membership Plan';
    document.getElementById('plan-id').value       = id || '';
    document.getElementById('plan-name').value     = '';
    document.getElementById('plan-desc').value     = '';
    document.getElementById('plan-price').value    = '';
    document.getElementById('plan-duration').value = '';
    document.getElementById('plan-active').value   = 'true';
    if (id) {
      try {
        const res  = await fetch(`${API}/admin/plans/${id}/`, { headers: authHeaders() });
        const plan = await res.json();
        document.getElementById('plan-name').value     = plan.name;
        document.getElementById('plan-desc').value     = plan.description;
        document.getElementById('plan-price').value    = plan.price;
        document.getElementById('plan-duration').value = plan.duration;
        document.getElementById('plan-active').value   = plan.is_active ? 'true' : 'false';
      } catch { toast('Failed to load plan.', 'error'); return; }
    }
    openModal('modal-plan');
  }

  async function savePlan() {
    const id   = document.getElementById('plan-id').value;
    const body = {
      name:        document.getElementById('plan-name').value,
      description: document.getElementById('plan-desc').value,
      price:       parseFloat(document.getElementById('plan-price').value),
      duration:    parseInt(document.getElementById('plan-duration').value),
      is_active:   document.getElementById('plan-active').value === 'true',
    };
    try {
      const res = id
        ? await fetch(`${API}/admin/plans/${id}/`, { method:'PUT',  headers:authHeaders(), body:JSON.stringify(body) })
        : await fetch(`${API}/admin/plans/`,        { method:'POST', headers:authHeaders(), body:JSON.stringify(body) });
      if (res.ok) {
        toast(id ? 'Plan updated! ✅' : 'Plan created! ✅');
        closeModal('modal-plan');
        loadPlans();
      } else {
        const err = await res.json();
        toast(Object.values(err).flat()[0] || 'Save failed.', 'error');
      }
    } catch { toast('Network error.', 'error'); }
  }

  async function deactivatePlan(id) {
    if (!confirm('Deactivate this plan? Members already on this plan are unaffected.')) return;
    try {
      const res = await fetch(`${API}/admin/plans/${id}/`, { method:'DELETE', headers:authHeaders() });
      if (res.ok) { toast('Plan deactivated.'); loadPlans(); }
      else toast('Failed to deactivate.', 'error');
    } catch { toast('Network error.', 'error'); }
  }

  // ─────────────────────────────────────────
  //  PERSONAL TRAINERS
  // ─────────────────────────────────────────
  async function loadTrainers() {
    const tbody = document.getElementById('trainers-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading</td></tr>';
    try {
      const res  = await fetch(`${API}/admin/trainers/`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error();
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><span class="emoji">🏋</span><p>No trainers yet.</p></div></td></tr>';
        return;
      }
      tbody.innerHTML = data.map(t => `
        <tr>
          <td style="color:var(--txt-dim)">#${t.id}</td>
          <td>${t.name}</td>
          <td style="color:var(--txt-dim)">${t.specialty}</td>
          <td style="color:var(--orange);font-weight:700">${t.experience} yr${t.experience !== 1 ? 's' : ''}</td>
          <td><span class="badge ${t.is_available ? 'badge-avail' : 'badge-unavail'}">${t.is_available ? 'Available' : 'Unavailable'}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openTrainerModal(${t.id})">Edit</button>
            <button class="btn btn-danger btn-sm" style="margin-left:6px" onclick="deleteTrainer(${t.id},'${t.name}')">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="6" class="loading">⚠️ Failed to load trainers.</td></tr>';
    }
  }

  async function openTrainerModal(id = null) {
    document.getElementById('trainer-modal-title').textContent = id ? 'Edit Trainer' : 'New Personal Trainer';
    document.getElementById('trainer-id').value         = id || '';
    document.getElementById('trainer-name').value       = '';
    document.getElementById('trainer-specialty').value  = '';
    document.getElementById('trainer-experience').value = '';
    document.getElementById('trainer-available').value  = 'true';
    if (id) {
      try {
        const res     = await fetch(`${API}/admin/trainers/${id}/`, { headers: authHeaders() });
        const trainer = await res.json();
        document.getElementById('trainer-name').value       = trainer.name;
        document.getElementById('trainer-specialty').value  = trainer.specialty;
        document.getElementById('trainer-experience').value = trainer.experience;
        document.getElementById('trainer-available').value  = trainer.is_available ? 'true' : 'false';
      } catch { toast('Failed to load trainer.', 'error'); return; }
    }
    openModal('modal-trainer');
  }

  async function saveTrainer() {
    const id   = document.getElementById('trainer-id').value;
    const body = {
      name:         document.getElementById('trainer-name').value,
      specialty:    document.getElementById('trainer-specialty').value,
      experience:   parseInt(document.getElementById('trainer-experience').value),
      is_available: document.getElementById('trainer-available').value === 'true',
    };
    try {
      const res = id
        ? await fetch(`${API}/admin/trainers/${id}/`, { method:'PUT',  headers:authHeaders(), body:JSON.stringify(body) })
        : await fetch(`${API}/admin/trainers/`,        { method:'POST', headers:authHeaders(), body:JSON.stringify(body) });
      if (res.ok) {
        toast(id ? 'Trainer updated! ✅' : 'Trainer added! ✅');
        closeModal('modal-trainer');
        loadTrainers();
      } else {
        const err = await res.json();
        toast(Object.values(err).flat()[0] || 'Save failed.', 'error');
      }
    } catch { toast('Network error.', 'error'); }
  }

  async function deleteTrainer(id, name) {
    if (!confirm(`Permanently delete trainer "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/admin/trainers/${id}/`, { method:'DELETE', headers:authHeaders() });
      if (res.ok) { toast('Trainer deleted.'); loadTrainers(); }
      else toast('Failed to delete trainer.', 'error');
    } catch { toast('Network error.', 'error'); }
  }

  async function deleteApplication(id) {
        if (!confirm('Permanently delete this rejected application? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API}/admin/applications/${id}/`, {
                method:  'DELETE',
                headers: authHeaders(),
            });
            if (res.ok) {
                toast('Application deleted successfully. ✅');
                loadApplications();
                loadDashboard();
            } else {
                const data = await res.json();
                toast(data.error || 'Failed to delete application.', 'error');
            }
        } catch {
            toast('Network error.', 'error');
        }
    }

    async function refreshToken() {
    const refresh = localStorage.getItem('adminRefresh');
    if (!refresh) { logout(); return null; }

    const res  = await fetch('http://127.0.0.1:8000/api/users/token/refresh/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh }),
    });

    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.access);
        return data.access;
    } else {
        logout(); // refresh token also expired, force re-login
        return null;
    }
}
    
  // — Init —
  loadDashboard();