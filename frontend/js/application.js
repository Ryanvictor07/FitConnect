let selectedPlan    = null;
let selectedTrainer = null;
let plansData       = [];
let trainersData    = [];

requireAuth();

async function loadPlans() {
    const res = await fetch(`${API}/plans/`, { headers: getAuthHeaders() });
    plansData = await res.json();
    const list = document.getElementById('plans-list');
    list.innerHTML = plansData.map(p => `
        <div class="plan-item" id="plan-${p.id}" onclick="selectPlan(${p.id}, '${p.name}', '${p.price}')">
            <div>
                <p class="plan-name">${p.name}</p>
                <p class="plan-desc">${p.description}</p>
            </div>
            <span class="plan-price">₱${p.price}/mo</span>
        </div>
    `).join('');
}

async function loadTrainers() {
    const res    = await fetch(`${API}/trainers/`, { headers: getAuthHeaders() });
    trainersData = await res.json();
    const list   = document.getElementById('trainers-list');
    list.innerHTML = `
        <div class="trainer-item selected" id="trainer-none" onclick="selectTrainer(null, 'No trainer')">
            <div class="trainer-avatar">—</div>
            <div>
                <p class="plan-name">No trainer</p>
                <p class="plan-desc">I'll train on my own</p>
            </div>
        </div>
    ` + trainersData.map(t => `
        <div class="trainer-item" id="trainer-${t.id}" onclick="selectTrainer(${t.id}, '${t.name}')">
            <div class="trainer-avatar">${t.name[0]}</div>
            <div>
                <p class="plan-name">${t.name}</p>
                <p class="plan-desc">${t.specialty} · ${t.experience} yrs exp.</p>
            </div>
        </div>
    `).join('');
    selectedTrainer = { id: null, name: 'No trainer' };
}

function selectPlan(id, name, price) {
    plansData.forEach(p => {
        const el = document.getElementById(`plan-${p.id}`);
        if (el) el.className = 'plan-item';
    });
    document.getElementById(`plan-${id}`).className = 'plan-item selected';
    selectedPlan = { id, name, price };
    document.getElementById('r-plan').textContent = `${name} — ₱${price}/mo`;
}

function selectTrainer(id, name) {
    trainersData.forEach(t => {
        const el = document.getElementById(`trainer-${t.id}`);
        if (el) el.className = 'trainer-item';
    });
    const noneEl = document.getElementById('trainer-none');
    if (noneEl) noneEl.className = 'trainer-item';
    const el = id ? document.getElementById(`trainer-${id}`) : noneEl;
    if (el) el.className = 'trainer-item selected';
    selectedTrainer = { id, name };
    document.getElementById('r-trainer').textContent = name;
}


function goStep(n) {
    [1, 2, 3, 4].forEach(i => {
        document.getElementById(`page-${i}`).style.display = i === n ? 'block' : 'none';
        const s = document.getElementById(`s${i}`);
        if (s) s.className = 'step' + (i < n ? ' done' : '') + (i === n ? ' active' : '');
    });

    // Update step labels (new HTML uses these IDs)
    const labels = { 1:'Personal Info', 2:'Choose Plan', 3:'Choose Trainer', 4:'Review & Submit' };
    const pcts   = { 1:'25%', 2:'50%', 3:'75%', 4:'100%' };
    const labelEl = document.getElementById('step-label-text');
    const pctEl   = document.getElementById('step-num-label');
    if (labelEl) labelEl.textContent = `Step ${n} of 4 — ${labels[n]}`;
    if (pctEl)   pctEl.textContent   = pcts[n];

    if (n === 2) loadPlans();
    if (n === 3) loadTrainers();
    if (n === 4) {
        document.getElementById('r-name').textContent  =
            `${document.getElementById('first_name').value} ${document.getElementById('last_name').value}`.trim() || '—';
        document.getElementById('r-email').textContent =
            document.getElementById('email').value || '—';
        if (!selectedPlan)   document.getElementById('r-plan').textContent    = 'No plan selected';
        if (!selectedTrainer) document.getElementById('r-trainer').textContent = 'None';
    }
}

async function submitApplication() {
    hideError('error-msg');
    if (!selectedPlan) {
        showError('error-msg', 'Please select a membership plan.');
        goStep(2);
        return;
    }
    try {
        const res  = await fetch(`${API}/apply/`, {
            method:  'POST',
            headers: getAuthHeaders(),
            body:    JSON.stringify({ plan: selectedPlan.id }),
        });
        const data = await res.json();
        if (res.ok) {
            if (selectedTrainer && selectedTrainer.id) {
                await fetch(`${API}/trainers/request/`, {
                    method:  'POST',
                    headers: getAuthHeaders(),
                    body:    JSON.stringify({
                        trainer:     selectedTrainer.id,
                        application: data.id,
                    }),
                });
            }
            window.location.href = 'status.html';
        } else {
            showError('error-msg', JSON.stringify(data));
        }
    } catch {
        showError('error-msg', 'Cannot connect to server.');
    }
}