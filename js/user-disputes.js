const API_BASE = (window.location.protocol.startsWith('http') && window.location.port !== '5500') ? '' : 'http://localhost:5000';

const userId = Number(localStorage.getItem('agrilink_user_id'));
const userName = localStorage.getItem('agrilink_user') || 'User';
const userRole = localStorage.getItem('agrilink_role') || 'farmer';

let allDisputes = [];
let userTransactions = [];

// ==================================================
// SESSION & UI INITIALIZATION
// ==================================================
const userNameEl = document.getElementById('userName');
const userAvatarEl = document.getElementById('userAvatar');
if (userNameEl) userNameEl.textContent = userName;
if (userAvatarEl) userAvatarEl.textContent = userName.charAt(0).toUpperCase();

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3200);
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function statusBadge(status) {
    const s = String(status || 'open').toLowerCase();
    if (s === 'resolved') {
        return '<span class="badge badge-success">Resolved</span>';
    }
    if (s === 'under_review') {
        return '<span class="badge" style="background:#e1f5fe;color:#0288d1;">Under Review</span>';
    }
    if (s === 'dismissed') {
        return '<span class="badge" style="background:#eeeeee;color:#616161;">Dismissed</span>';
    }
    return '<span class="badge badge-warning">Open</span>';
}

function priorityBadge(priority) {
    const p = String(priority || 'medium').toLowerCase();
    if (p === 'high') {
        return '<span class="badge badge-danger">High Priority</span>';
    }
    if (p === 'low') {
        return '<span class="badge" style="background:#e8f4f8;color:#0984e3;">Low Priority</span>';
    }
    return '<span class="badge badge-warning">Medium Priority</span>';
}

// ==================================================
// LOAD TRUST SCORE
// ==================================================
async function loadTrustScore() {
    if (!userId) return;
    try {
        const res = await fetch(`${API_BASE}/api/reviews/user/${userId}`);
        if (!res.ok) return;

        const data = await res.json();
        const scoreEl = document.getElementById('userTrustScore');
        if (scoreEl) {
            scoreEl.innerHTML = `
                <span style="display:inline-flex;align-items:center;gap:4px;background:#fff8e1;color:#b78103;padding:4px 10px;border-radius:14px;font-size:12px;font-weight:700;border:1px solid #ffe082;">
                    ★ ${data.trustScore} <span style="font-weight:normal;color:#795548;">(${data.totalReviews} reviews)</span>
                </span>
            `;
        }
    } catch (err) {
        console.error('Trust score error:', err);
    }
}

// ==================================================
// LOAD DISPUTES
// ==================================================
async function loadDisputes() {
    const tbody = document.getElementById('disputesTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">
                    Loading disputes...
                </td>
            </tr>
        `;
    }

    try {
        const activeId = userId || (userRole === 'buyer' ? 5 : 4);
        const res = await fetch(`${API_BASE}/api/disputes/my-disputes?userId=${activeId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load disputes');

        allDisputes = data.disputes || [];
        updateStats();
        renderDisputes();
        await loadTrustScore();
        loadEligibleTransactions();

    } catch (err) {
        console.error('Load disputes error:', err);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:30px;color:#c0392b;">
                        Failed to load disputes: ${escapeHtml(err.message)}
                    </td>
                </tr>
            `;
        }
    }
}

function updateStats() {
    const total = allDisputes.length;
    const openCount = allDisputes.filter(d => ['open', 'under_review'].includes(String(d.status).toLowerCase())).length;
    const resolvedCount = allDisputes.filter(d => String(d.status).toLowerCase() === 'resolved').length;

    const totalEl = document.getElementById('totalDisputes');
    const openEl = document.getElementById('openDisputes');
    const resolvedEl = document.getElementById('resolvedDisputes');

    if (totalEl) totalEl.textContent = total;
    if (openEl) openEl.textContent = openCount;
    if (resolvedEl) resolvedEl.textContent = resolvedCount;
}

function renderDisputes() {
    const tbody = document.getElementById('disputesTableBody');
    if (!tbody) return;

    const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    const filtered = allDisputes.filter(d => {
        const ticket = String(d.ticket_code || '').toLowerCase();
        const issue = String(d.issue_type || '').toLowerCase();
        const against = String(d.against_name || '').toLowerCase();
        const raised = String(d.raised_by_name || '').toLowerCase();
        const status = String(d.status || '').toLowerCase();

        const matchSearch = !search || ticket.includes(search) || issue.includes(search) || against.includes(search) || raised.includes(search);
        const matchStatus = statusFilter === 'all' || status === statusFilter;

        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:35px;color:var(--text-muted);">
                    No dispute records found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(d => {
        const isMyTicket = d.relationship === 'raised_by_me';
        const otherParty = isMyTicket ? d.against_name : d.raised_by_name;
        const roleLabel = isMyTicket ? 'Filed by you against' : 'Filed against you by';

        return `
            <tr>
                <td>
                    <strong style="color:var(--color-primary);font-family:monospace;font-size:14px;">${escapeHtml(d.ticket_code)}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">Txn #${d.transaction_id}</div>
                </td>
                <td>
                    <strong>${escapeHtml(otherParty || 'Other Party')}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${roleLabel}</div>
                </td>
                <td>
                    <strong>${escapeHtml(d.issue_type)}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(d.crop_name || 'Produce')} (₹${d.transaction_amount || 0})</div>
                </td>
                <td>
                    ${priorityBadge(d.priority)}
                </td>
                <td>
                    ${statusBadge(d.status)}
                </td>
                <td>
                    ${formatDate(d.created_at)}
                </td>
                <td style="max-width:240px;">
                    ${d.resolution ? `
                        <div style="font-size:12px;color:#1e824c;background:#e8f8f5;padding:6px 10px;border-radius:6px;line-height:1.3;">
                            <strong>Resolution:</strong> ${escapeHtml(d.resolution)}
                        </div>
                    ` : `
                        <span style="font-size:12px;color:var(--text-muted);font-style:italic;">Awaiting Admin Review</span>
                    `}
                </td>
                <td>
                    <button class="btn-secondary" style="padding:5px 10px;font-size:12px;" onclick="viewDisputeDetails(${d.id})">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function viewDisputeDetails(id) {
    const d = allDisputes.find(item => item.id === id);
    if (!d) return;

    const modal = document.getElementById('viewDetailsModal');
    if (!modal) return;

    document.getElementById('modalTicketCode').textContent = d.ticket_code;
    document.getElementById('modalTxnInfo').textContent = `Transaction #${d.transaction_id} (${d.crop_name || 'Produce'} - ₹${d.transaction_amount || 0})`;
    document.getElementById('modalParties').textContent = `Raised by ${d.raised_by_name} against ${d.against_name}`;
    document.getElementById('modalIssueType').textContent = d.issue_type;
    document.getElementById('modalPriority').innerHTML = priorityBadge(d.priority);
    document.getElementById('modalStatus').innerHTML = statusBadge(d.status);
    document.getElementById('modalDescription').textContent = d.description || 'No additional description provided.';
    document.getElementById('modalResolution').textContent = d.resolution ? `${d.resolution} (Resolved on ${formatDate(d.resolved_at)})` : 'Pending review and resolution by platform Administrator.';

    modal.style.display = 'flex';
}

function closeDetailsModal() {
    const modal = document.getElementById('viewDetailsModal');
    if (modal) modal.style.display = 'none';
}

// ==================================================
// LOAD ELIGIBLE TRANSACTIONS FOR NEW DISPUTE MODAL
// ==================================================
async function loadEligibleTransactions() {
    try {
        const activeId = userId || (userRole === 'buyer' ? 5 : 4);
        const url = userRole === 'buyer' 
            ? `${API_BASE}/api/buyer/transactions/${activeId}`
            : `${API_BASE}/api/farmer/transactions/${activeId}`;
        
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        userTransactions = Array.isArray(data) ? data : (data.transactions || []);

        const selectEl = document.getElementById('newDisputeTxnSelect');
        if (selectEl) {
            selectEl.innerHTML = '<option value="">-- Select Transaction --</option>' + 
                userTransactions.map(t => {
                    const other = userRole === 'buyer' ? (t.farmer_name || 'Farmer') : (t.buyer_name || 'Buyer');
                    return `<option value="${t.id}">TXN-${String(t.id).padStart(5, '0')} - with ${escapeHtml(other)} (₹${t.amount || 0})</option>`;
                }).join('');
        }
    } catch (err) {
        console.error('Load eligible transactions error:', err);
    }
}

function openNewDisputeModal() {
    const modal = document.getElementById('newDisputeModal');
    if (modal) modal.style.display = 'flex';
}

function closeNewDisputeModal() {
    const modal = document.getElementById('newDisputeModal');
    if (modal) modal.style.display = 'none';
}

async function submitNewDispute(e) {
    e.preventDefault();
    const txnId = document.getElementById('newDisputeTxnSelect').value;
    const issueType = document.getElementById('newDisputeIssueType').value;
    const priority = document.getElementById('newDisputePriority').value;
    const description = document.getElementById('newDisputeDescription').value;

    if (!txnId) {
        alert('Please select a transaction.');
        return;
    }

    try {
        const activeId = userId || (userRole === 'buyer' ? 5 : 4);
        const res = await fetch(`${API_BASE}/api/disputes/raise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_id: Number(txnId),
                raised_by_id: Number(activeId),
                issue_type: issueType,
                description: description,
                priority: priority
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to raise dispute');

        showToast(`Dispute ticket ${data.ticketCode} raised successfully. Admin notified.`, 'warning');
        closeNewDisputeModal();
        await loadDisputes();

    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================================================
// INITIALIZATION
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    loadDisputes();

    document.getElementById('searchInput')?.addEventListener('input', renderDisputes);
    document.getElementById('statusFilter')?.addEventListener('change', renderDisputes);
    document.getElementById('refreshBtn')?.addEventListener('click', loadDisputes);
    document.getElementById('newDisputeForm')?.addEventListener('submit', submitNewDispute);

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });
});
