const API_BASE = (window.location.protocol.startsWith('http') && window.location.port !== '5500') ? '' : 'http://localhost:5000';

const adminToken = localStorage.getItem('agrilink_token');
const adminRole = localStorage.getItem('agrilink_role');
const adminUser = localStorage.getItem('agrilink_user') || 'System Admin';

// ==================================================
// 1. ADMIN AUTHENTICATION GUARD
// ==================================================
if (!adminToken || adminRole !== 'admin') {
    // If not logged in as admin, redirect to admin login
    if (!window.location.pathname.includes('admin-login.html')) {
        window.location.href = 'admin-login.html';
    }
}

// ==================================================
// 2. COMMON HELPERS
// ==================================================
function escapeHtml(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatPrice(val) {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function showToast(msg, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:99999;padding:12px 20px;border-radius:8px;color:white;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,0.2);display:none;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'error' ? '#c0392b' : (type === 'warning' ? '#f39c12' : '#16834b');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

function initAdminProfile() {
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');

    if (nameEl) nameEl.textContent = adminUser;
    if (avatarEl) avatarEl.textContent = adminUser.charAt(0).toUpperCase();

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('agrilink_token');
            localStorage.removeItem('agrilink_role');
            localStorage.removeItem('agrilink_user');
            localStorage.removeItem('agrilink_email');
            localStorage.removeItem('agrilink_user_id');
            window.location.href = 'admin-login.html';
        });
    }
}

// ==================================================
// 3. DASHBOARD OVERVIEW (dashboard-admin.html)
// ==================================================
async function loadAdminOverview() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/overview`);
        if (!res.ok) throw new Error('Failed to load overview');

        const data = await res.json();
        const s = data.stats || {};

        // Stat Cards
        const totalGmvEl = document.getElementById('statTotalGmv');
        const activeUsersEl = document.getElementById('statActiveUsers');
        const openDisputesEl = document.getElementById('statOpenDisputes');
        const platformRevenueEl = document.getElementById('statPlatformRevenue');
        const avgTrustEl = document.getElementById('statAvgTrust');

        if (totalGmvEl) totalGmvEl.textContent = formatPrice(s.totalGmv);
        if (activeUsersEl) activeUsersEl.textContent = Number(s.totalUsers || 0).toLocaleString();
        if (openDisputesEl) openDisputesEl.textContent = s.openDisputes || 0;
        if (platformRevenueEl) platformRevenueEl.textContent = formatPrice(s.platformRevenue);
        if (avgTrustEl) avgTrustEl.textContent = `★ ${s.avgTrustScore || 5.0} (${s.totalReviews || 0})`;

        // Render Recent Activity
        const actContainer = document.getElementById('recentActivityContainer');
        if (actContainer) {
            const txns = data.recentActivity?.transactions || [];
            const disputes = data.recentActivity?.disputes || [];

            let html = '';
            if (disputes.length > 0) {
                const d = disputes[0];
                html += `
                    <div style="display:flex;gap:12px;padding:12px;border-radius:8px;background:rgba(231,76,60,0.05);border-left:4px solid #e74c3c;">
                        <i data-lucide="alert-triangle" style="color:#e74c3c;width:20px;height:20px;flex-shrink:0;margin-top:2px;"></i>
                        <div>
                            <div style="font-weight:600;font-size:14px;">Dispute ${d.ticket_code}: ${escapeHtml(d.issue_type)}</div>
                            <div style="font-size:13px;color:var(--text-muted);">${escapeHtml(d.raised_by_name)} vs ${escapeHtml(d.against_name)}</div>
                            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${formatDate(d.activity_date)}</div>
                        </div>
                    </div>
                `;
            }

            txns.slice(0, 3).forEach(t => {
                html += `
                    <div style="display:flex;gap:12px;padding:12px;border-radius:8px;background:rgba(27,94,32,0.05);border-left:4px solid var(--color-primary);">
                        <i data-lucide="banknote" style="color:var(--color-primary);width:20px;height:20px;flex-shrink:0;margin-top:2px;"></i>
                        <div>
                            <div style="font-weight:600;font-size:14px;">Transaction #${t.id} (${t.crop_name || 'Produce'})</div>
                            <div style="font-size:13px;color:var(--text-muted);">${formatPrice(t.amount)} paid by ${escapeHtml(t.buyer_name || 'Buyer')} to ${escapeHtml(t.farmer_name || 'Farmer')}</div>
                            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${formatDate(t.activity_date)}</div>
                        </div>
                    </div>
                `;
            });

            actContainer.innerHTML = html || '<div style="color:var(--text-muted);padding:15px;">No recent activity.</div>';
            if (window.lucide) lucide.createIcons();
        }

    } catch (err) {
        console.error('Overview error:', err);
    }
}

// ==================================================
// 4. USER MANAGEMENT (admin-users.html)
// ==================================================
let adminUsersList = [];

async function loadAdminUsers() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;">Loading platform users...</td></tr>';

    try {
        const searchInput = document.getElementById('userSearchInput');
        const roleFilter = document.getElementById('userRoleFilter');
        const statusFilter = document.getElementById('userStatusFilter');

        const search = searchInput ? searchInput.value.trim() : '';
        const role = roleFilter ? roleFilter.value : 'all';
        const status = statusFilter ? statusFilter.value : 'all';

        const url = new URL(`${API_BASE}/api/admin/users`, window.location.origin);
        if (search) url.searchParams.set('search', search);
        if (role && role !== 'All Roles') url.searchParams.set('role', role);
        if (status && status !== 'All Status') url.searchParams.set('status', status);

        const res = await fetch(url);
        const data = await res.json();
        adminUsersList = data.users || [];

        renderAdminUsersTable();
        updateUserStats(adminUsersList);

    } catch (err) {
        console.error('Users load error:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#c0392b;padding:24px;">Failed to load users: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function updateUserStats(users) {
    const totalEl = document.getElementById('statTotalUsers');
    const farmersEl = document.getElementById('statTotalFarmers');
    const buyersEl = document.getElementById('statTotalBuyers');
    const fposEl = document.getElementById('statTotalFpos');

    if (!totalEl) return;
    totalEl.textContent = users.length;
    if (farmersEl) farmersEl.textContent = users.filter(u => u.role === 'farmer').length;
    if (buyersEl) buyersEl.textContent = users.filter(u => u.role === 'buyer').length;
    if (fposEl) fposEl.textContent = users.filter(u => u.role === 'fpo').length;
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    if (adminUsersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">No users found matching filters.</td></tr>';
        return;
    }

    tbody.innerHTML = adminUsersList.map(u => {
        const roleBg = u.role === 'farmer' ? '#e8f5e9' : (u.role === 'buyer' ? '#e3f2fd' : '#fff3e0');
        const roleColor = u.role === 'farmer' ? '#2e7d32' : (u.role === 'buyer' ? '#1565c0' : '#ef6c00');
        const statusBadge = u.status === 'active' 
            ? '<span class="badge badge-success">Active</span>' 
            : (u.status === 'suspended' ? '<span class="badge badge-danger">Suspended</span>' : '<span class="badge badge-warning">Under Review</span>');

        const trustScore = Number(u.trustScore || 5.0).toFixed(1);
        const reviewCount = u.reviewCount || 0;

        let statusActionBtn = '';
        if (u.status === 'active') {
            statusActionBtn = `<button class="action-btn" style="background:#dc3545;color:white;padding:4px 8px;font-size:11px;" onclick="changeUserStatus(${u.id}, 'suspended')">Suspend</button>`;
        } else if (u.status === 'suspended') {
            statusActionBtn = `<button class="action-btn" style="background:#198754;color:white;padding:4px 8px;font-size:11px;" onclick="changeUserStatus(${u.id}, 'active')">Reinstate</button>`;
        } else {
            statusActionBtn = `<button class="action-btn" style="background:#198754;color:white;padding:4px 8px;font-size:11px;" onclick="changeUserStatus(${u.id}, 'active')">Approve</button>`;
        }

        return `
            <tr>
                <td><strong>USR-${String(u.id).padStart(4, '0')}</strong></td>
                <td>
                    <div style="font-weight:600;">${escapeHtml(u.name)}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(u.email)}</div>
                </td>
                <td>
                    <span class="badge" style="background:${roleBg};color:${roleColor};">${u.role.toUpperCase()}</span>
                </td>
                <td>
                    <span style="display:inline-flex;align-items:center;gap:3px;font-weight:600;color:#f39c12;">
                        ★ ${trustScore}
                    </span>
                    <span style="font-size:11px;color:var(--text-muted);">(${reviewCount})</span>
                </td>
                <td>${escapeHtml(u.district)}</td>
                <td>${formatDate(u.created_at)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display:flex;gap:6px;align-items:center;">
                        ${statusActionBtn}
                        <button class="action-btn" style="background:#f8d7da;color:#721c24;padding:4px 8px;font-size:11px;" onclick="deleteUser(${u.id}, '${escapeHtml(u.name)}')">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

async function changeUserStatus(userId, newStatus) {
    if (!confirm(`Are you sure you want to set this user status to ${newStatus.toUpperCase()}?`)) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update status');
        showToast(`User status updated to ${newStatus}.`);
        loadAdminUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function deleteUser(userId, userName) {
    if (!confirm(`CAUTION: Are you sure you want to permanently delete user "${userName}"? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete user');
        showToast('User deleted successfully.');
        loadAdminUsers();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function openAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) modal.style.display = 'flex';
}

function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) modal.style.display = 'none';
}

async function handleAddUserSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    const district = document.getElementById('newUserDistrict').value.trim();
    const phone = document.getElementById('newUserPhone').value.trim();

    try {
        const res = await fetch(`${API_BASE}/api/admin/users/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, district, phone })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create user');

        showToast('User created successfully!');
        closeAddUserModal();
        e.target.reset();
        loadAdminUsers();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================================================
// 5. TRANSACTIONS MONITOR (admin-transactions.html)
// ==================================================
let adminTransactionsList = [];

async function loadAdminTransactions() {
    const tbody = document.getElementById('adminTransactionsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;">Loading transactions...</td></tr>';

    try {
        const statusFilter = document.getElementById('txnStatusFilter');
        const startDate = document.getElementById('txnStartDate');
        const endDate = document.getElementById('txnEndDate');

        const url = new URL(`${API_BASE}/api/admin/transactions`, window.location.origin);
        if (statusFilter && statusFilter.value !== 'All Status') url.searchParams.set('status', statusFilter.value);
        if (startDate && startDate.value) url.searchParams.set('startDate', startDate.value);
        if (endDate && endDate.value) url.searchParams.set('endDate', endDate.value);

        const res = await fetch(url);
        const data = await res.json();
        adminTransactionsList = data.transactions || [];

        renderAdminTransactionsTable();

        // Calculate Header Stats
        const totalVolume = adminTransactionsList.reduce((acc, t) => acc + (t.status === 'completed' ? Number(t.amount || 0) : 0), 0);
        const totalFee = totalVolume * 0.01;

        const volEl = document.getElementById('statTotalVolume');
        const feeEl = document.getElementById('statTotalFee');
        if (volEl) volEl.textContent = formatPrice(totalVolume);
        if (feeEl) feeEl.textContent = formatPrice(totalFee);

    } catch (err) {
        console.error('Transactions load error:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#c0392b;padding:24px;">Failed: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderAdminTransactionsTable() {
    const tbody = document.getElementById('adminTransactionsTableBody');
    if (!tbody) return;

    if (adminTransactionsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text-muted);">No transactions found.</td></tr>';
        return;
    }

    tbody.innerHTML = adminTransactionsList.map(t => {
        let statusBadge = '<span class="badge badge-warning">Pending</span>';
        if (t.status === 'completed') statusBadge = '<span class="badge badge-success">Completed</span>';
        if (t.status === 'cancelled') statusBadge = '<span class="badge badge-danger">Cancelled</span>';

        let disputeBadge = '';
        if (t.dispute_ticket) {
            disputeBadge = `<span class="badge badge-danger" style="margin-left:4px;">${escapeHtml(t.dispute_ticket)}</span>`;
        }

        let ratingBadge = '';
        if (t.transaction_rating) {
            ratingBadge = `<span style="font-size:11px;color:#f39c12;font-weight:600;">★ ${Number(t.transaction_rating).toFixed(1)}</span>`;
        }

        return `
            <tr>
                <td><strong>TXN-${String(t.id).padStart(5, '0')}</strong> ${disputeBadge}</td>
                <td>${formatDate(t.transaction_date)}</td>
                <td>${escapeHtml(t.buyer_name || 'Buyer')}</td>
                <td>${escapeHtml(t.seller_name || 'Farmer')}</td>
                <td>${escapeHtml(t.crop_name || 'Produce')} (${Number(t.quantity || 0)} ${t.unit || 'kg'})</td>
                <td><strong>${formatPrice(t.amount)}</strong></td>
                <td style="color:var(--color-primary);font-weight:600;">${formatPrice(t.platform_fee)}</td>
                <td>${statusBadge} ${ratingBadge}</td>
                <td>
                    <button class="action-btn" style="background:#eee;padding:4px 8px;font-size:11px;" onclick="viewTransactionDetails(${t.id})">View</button>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function viewTransactionDetails(txnId) {
    const t = adminTransactionsList.find(item => item.id === txnId);
    if (!t) return;
    alert(`Transaction Details:
TXN-${String(t.id).padStart(5, '0')}
Buyer: ${t.buyer_name} (${t.buyer_email})
Seller: ${t.seller_name} (${t.seller_email})
Produce: ${t.crop_name} (${t.quantity} ${t.unit})
Total Amount: ${formatPrice(t.amount)}
Platform Fee (1%): ${formatPrice(t.platform_fee)}
Status: ${t.status.toUpperCase()}
Date: ${formatDate(t.transaction_date)}
${t.dispute_ticket ? `Dispute Ticket: ${t.dispute_ticket} (${t.dispute_status})` : 'No disputes filed'}`);
}

function exportTransactionsCSV() {
    if (adminTransactionsList.length === 0) {
        alert('No transactions available to export.');
        return;
    }

    const headers = ['Txn ID', 'Date', 'Buyer', 'Seller', 'Produce', 'Quantity', 'Amount', 'Platform Fee', 'Status'];
    const rows = adminTransactionsList.map(t => [
        `TXN-${String(t.id).padStart(5, '0')}`,
        formatDate(t.transaction_date),
        `"${(t.buyer_name || '').replace(/"/g, '""')}"`,
        `"${(t.seller_name || '').replace(/"/g, '""')}"`,
        `"${(t.crop_name || '').replace(/"/g, '""')}"`,
        `${t.quantity || 0} ${t.unit || 'kg'}`,
        t.amount || 0,
        t.platform_fee || 0,
        t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AgriLink-Transactions-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// ==================================================
// 6. DISPUTES CONTROL (admin-disputes.html)
// ==================================================
let adminDisputesList = [];

async function loadAdminDisputes() {
    const openTbody = document.getElementById('adminOpenDisputesBody');
    const resolvedTbody = document.getElementById('adminResolvedDisputesBody');

    if (openTbody) openTbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;">Loading open disputes...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/api/admin/disputes`);
        const data = await res.json();
        adminDisputesList = data.disputes || [];

        // Stats
        const openStatEl = document.getElementById('statOpenDisputesCount');
        const resolvedStatEl = document.getElementById('statResolvedDisputesCount');
        if (openStatEl) openStatEl.textContent = data.stats?.open || 0;
        if (resolvedStatEl) resolvedStatEl.textContent = data.stats?.resolved || 0;

        renderAdminDisputesTables(data.openDisputes || [], data.resolvedDisputes || []);

    } catch (err) {
        console.error('Disputes load error:', err);
    }
}

function renderAdminDisputesTables(openDisputes, resolvedDisputes) {
    const openTbody = document.getElementById('adminOpenDisputesBody');
    const resolvedTbody = document.getElementById('adminResolvedDisputesBody');

    if (openTbody) {
        if (openDisputes.length === 0) {
            openTbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">No open disputes pending. Platform is smooth!</td></tr>';
        } else {
            openTbody.innerHTML = openDisputes.map(d => {
                const priorityBadge = d.priority === 'high' 
                    ? '<span class="badge badge-danger">High</span>' 
                    : (d.priority === 'medium' ? '<span class="badge badge-warning">Medium</span>' : '<span class="badge" style="background:#e8f0fe;color:#1a73e8;">Low</span>');

                return `
                    <tr>
                        <td><strong>${escapeHtml(d.ticket_code)}</strong></td>
                        <td>${formatDate(d.created_at)}</td>
                        <td><strong>${escapeHtml(d.raised_by_name)}</strong> <span style="font-size:11px;color:var(--text-muted);">(${d.raised_by_role})</span></td>
                        <td><strong>${escapeHtml(d.against_name)}</strong> <span style="font-size:11px;color:var(--text-muted);">(${d.against_role})</span></td>
                        <td>TXN-${String(d.transaction_id).padStart(5, '0')}</td>
                        <td>${escapeHtml(d.issue_type)}</td>
                        <td>${priorityBadge}</td>
                        <td>
                            <div style="display:flex;gap:6px;">
                                <button class="action-btn" style="background:var(--color-primary);color:white;" onclick="openReviewCaseModal(${d.id})">Review Case</button>
                                <button class="action-btn" style="background:#eee;color:#333;" onclick="quickCloseDispute(${d.id})">Dismiss</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    if (resolvedTbody) {
        if (resolvedDisputes.length === 0) {
            resolvedTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">No resolved cases yet.</td></tr>';
        } else {
            resolvedTbody.innerHTML = resolvedDisputes.map(d => `
                <tr>
                    <td><strong>${escapeHtml(d.ticket_code)}</strong></td>
                    <td>${escapeHtml(d.raised_by_name)} vs ${escapeHtml(d.against_name)}</td>
                    <td>${escapeHtml(d.issue_type)}</td>
                    <td>${escapeHtml(d.resolution || 'Resolved by administrator')}</td>
                    <td>${formatDate(d.resolved_at || d.created_at)}</td>
                    <td><span class="badge badge-success">${escapeHtml(d.status.toUpperCase())}</span></td>
                </tr>
            `).join('');
        }
    }

    if (window.lucide) lucide.createIcons();
}

function openReviewCaseModal(disputeId) {
    const d = adminDisputesList.find(item => item.id === disputeId);
    if (!d) return;

    const modal = document.getElementById('reviewDisputeModal');
    if (!modal) {
        // Fallback prompt
        const resolution = prompt(`Review Dispute ${d.ticket_code}\nIssue: ${d.issue_type}\nDescription: ${d.description || 'N/A'}\n\nEnter resolution notes to resolve ticket:`);
        if (resolution) submitDisputeResolution(disputeId, 'resolved', resolution);
        return;
    }

    document.getElementById('modalTicketCode').textContent = d.ticket_code;
    document.getElementById('modalParties').textContent = `${d.raised_by_name} (${d.raised_by_role}) vs ${d.against_name} (${d.against_role})`;
    document.getElementById('modalTxnInfo').textContent = `Transaction #${d.transaction_id} — Amount: ${formatPrice(d.transaction_amount)}`;
    document.getElementById('modalIssue').textContent = d.issue_type;
    document.getElementById('modalDescription').textContent = d.description || 'No additional description provided.';
    document.getElementById('modalDisputeId').value = d.id;
    document.getElementById('modalResolutionInput').value = '';

    modal.style.display = 'flex';
}

function closeReviewCaseModal() {
    const modal = document.getElementById('reviewDisputeModal');
    if (modal) modal.style.display = 'none';
}

async function submitDisputeResolution(disputeId, status, resolution) {
    try {
        const res = await fetch(`${API_BASE}/api/admin/disputes/${disputeId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, resolution })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update dispute');

        showToast(`Dispute marked as ${status.toUpperCase()}.`);
        closeReviewCaseModal();
        loadAdminDisputes();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function quickCloseDispute(disputeId) {
    if (!confirm('Are you sure you want to dismiss this dispute?')) return;
    submitDisputeResolution(disputeId, 'dismissed', 'Dismissed by administrator after review.');
}

// ==================================================
// 7. REPORTS EXPORT (admin-reports.html)
// ==================================================
async function exportAdminReport(type, format) {
    try {
        const res = await fetch(`${API_BASE}/api/admin/reports/data?type=${type}`);
        const result = await res.json();
        const data = result.data || [];

        if (data.length === 0) {
            alert(`No data available for ${type} report.`);
            return;
        }

        if (format === 'csv') {
            const keys = Object.keys(data[0]);
            const csvRows = [
                keys.join(','),
                ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))
            ];
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AgriLink-${type}-Report-${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast(`${type.toUpperCase()} report exported successfully!`);
        } else {
            // PDF / Print view
            window.print();
        }
    } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
    }
}

// ==================================================
// 8. SYSTEM ANALYTICS (admin-analytics.html)
// ==================================================
async function loadAdminAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/analytics`);
        const data = await res.json();

        const uptimeEl = document.getElementById('analyticsUptime');
        const latencyEl = document.getElementById('analyticsLatency');
        const memoryEl = document.getElementById('analyticsMemory');

        if (uptimeEl) uptimeEl.textContent = data.system?.uptimeReadable || '100%';
        if (latencyEl) latencyEl.textContent = `${data.system?.latencyMs || 12}ms`;
        if (memoryEl) memoryEl.textContent = `${data.system?.memoryMb || 64} MB`;

    } catch (err) {
        console.error('Analytics error:', err);
    }
}

// ==================================================
// INITIALIZATION ON DOM READY
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    initAdminProfile();

    // Auto-detect which admin page we are on and load relevant data
    const path = window.location.pathname;

    if (path.includes('dashboard-admin.html')) {
        loadAdminOverview();
    } else if (path.includes('admin-users.html')) {
        loadAdminUsers();
        const search = document.getElementById('userSearchInput');
        const role = document.getElementById('userRoleFilter');
        const status = document.getElementById('userStatusFilter');
        if (search) search.addEventListener('input', renderAdminUsersTable);
        if (role) role.addEventListener('change', loadAdminUsers);
        if (status) status.addEventListener('change', loadAdminUsers);

        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) addUserForm.addEventListener('submit', handleAddUserSubmit);
    } else if (path.includes('admin-transactions.html')) {
        loadAdminTransactions();
        const statusFilter = document.getElementById('txnStatusFilter');
        const startDate = document.getElementById('txnStartDate');
        const endDate = document.getElementById('txnEndDate');
        const exportBtn = document.getElementById('exportTxnBtn');

        if (statusFilter) statusFilter.addEventListener('change', loadAdminTransactions);
        if (startDate) startDate.addEventListener('change', loadAdminTransactions);
        if (endDate) endDate.addEventListener('change', loadAdminTransactions);
        if (exportBtn) exportBtn.addEventListener('click', exportTransactionsCSV);
    } else if (path.includes('admin-disputes.html')) {
        loadAdminDisputes();
    } else if (path.includes('admin-reports.html')) {
        // Wire report buttons
        document.querySelectorAll('[data-export-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.getAttribute('data-export-type');
                const format = btn.getAttribute('data-export-format') || 'csv';
                exportAdminReport(type, format);
            });
        });
    } else if (path.includes('admin-analytics.html')) {
        loadAdminAnalytics();
    }

    if (window.lucide) lucide.createIcons();
});
