requireAuth();

const statusColors = {
    pending:  'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
};

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

        document.getElementById('s-plan').textContent     = data.plan_name || '—';
        document.getElementById('s-date').textContent     =
            new Date(data.submitted_at).toLocaleDateString();
        document.getElementById('s-reviewed').textContent =
            data.reviewed_at
                ? new Date(data.reviewed_at).toLocaleDateString()
                : 'Not yet reviewed';
        document.getElementById('s-reason').textContent   =
            data.rejection_reason || '—';

    } catch {
        document.getElementById('loading').textContent = 'Cannot connect to server.';
    }
}

loadStatus();
 
