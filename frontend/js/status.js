requireAuth();

const statusColors = {
    pending:  'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
};

function applyStatus(status) {
    const topBar   = document.getElementById('status-top-bar');
    const icon     = document.getElementById('status-icon');
    const titleTxt = document.getElementById('status-title-text');

    const s = (status || '').toLowerCase();

    topBar.className = 'status-card-top-bar ' + s;
    icon.className   = 'status-icon ' + s;

    if (s === 'approved') {
        icon.textContent = '✅';
        titleTxt.textContent = 'Approved';
    } else if (s === 'rejected') {
        icon.textContent = '❌';
        titleTxt.textContent = 'Not Approved';
    } else {
        icon.textContent = '⏳';
        titleTxt.textContent = 'Under Review';
    }

    document.getElementById('footer-date').textContent =
        'Updated: ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadStatus() {
    try {
        const res  = await fetch(`${API}/application/status/`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        document.getElementById('loading').style.display = 'none';

        if (res.status === 404 || !data || !data.plan_name) {
            document.getElementById('no-application').style.display = 'block';
            return;
        }

        document.getElementById('status-card').style.display = 'block';

        const color = statusColors[data.status] || 'badge-pending';
        document.getElementById('status-badge').innerHTML =
            `<span class="badge ${color}">${data.status}</span>`;

        // ✅ Call applyStatus directly here
        applyStatus(data.status);

        document.getElementById('s-plan').textContent     = data.plan_name || '—';
        document.getElementById('s-date').textContent     =
            new Date(data.submitted_at).toLocaleDateString();
        document.getElementById('s-reviewed').textContent =
            data.reviewed_at
                ? new Date(data.reviewed_at).toLocaleDateString()
                : 'Not yet reviewed';
        document.getElementById('s-reason').textContent   =
            data.rejection_reason || '—';

        // ✅ Show reapply button only when rejected — must be AFTER data is loaded
        if (data.status === 'rejected') {
            document.getElementById('reapply-section').style.display = 'block';
        } else {
            document.getElementById('reapply-section').style.display = 'none';
        }

    } catch {
        document.getElementById('loading').textContent = 'Cannot connect to server.';
    }
}

loadStatus();