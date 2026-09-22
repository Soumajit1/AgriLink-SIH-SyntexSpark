const API_BASE = (window.location.protocol.startsWith('http') && window.location.port !== '5500') ? '' : 'http://localhost:5000';

const buyerId = Number(localStorage.getItem('agrilink_user_id'));
const buyerUser = localStorage.getItem('agrilink_user') || 'Buyer';

let transactions = [];
let selectedRating = 5;

// ==================================================
// SESSION VALIDATION & HEADER INIT
// ==================================================
if (!buyerId) {
    // If not logged in, alert or redirect
    console.warn('Buyer session not found in localStorage. Checking fallback...');
}

const userNameEl = document.getElementById('userName');
const userAvatarEl = document.getElementById('userAvatar');
if (userNameEl) userNameEl.textContent = buyerUser;
if (userAvatarEl) userAvatarEl.textContent = buyerUser.charAt(0).toUpperCase();

// ==================================================
// HELPERS
// ==================================================
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatPrice(value) {
    return '₹' + Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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
    const normalized = String(status || 'pending').toLowerCase();
    if (normalized === 'completed') {
        return '<span class="badge badge-success">Completed</span>';
    }
    if (normalized === 'cancelled') {
        return '<span class="badge badge-danger">Cancelled</span>';
    }
    return '<span class="badge badge-warning">Pending</span>';
}

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

// ==================================================
// LOAD TRUST SCORE
// ==================================================
async function loadTrustScore() {
    if (!buyerId) return;
    try {
        const res = await fetch(`${API_BASE}/api/reviews/user/${buyerId}`);
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
// CALCULATE STATS
// ==================================================
function updateStats() {
    let totalSpent = 0;
    let completedCount = 0;
    let pendingAmount = 0;

    transactions.forEach(t => {
        const status = String(t.status || '').toLowerCase();
        const amt = Number(t.amount || 0);

        if (status === 'completed') {
            totalSpent += amt;
            completedCount += 1;
        } else if (status === 'pending') {
            pendingAmount += amt;
        }
    });

    const totalSpentEl = document.getElementById('totalSpent');
    const completedCountEl = document.getElementById('completedCount');
    const pendingAmountEl = document.getElementById('pendingAmount');

    if (totalSpentEl) totalSpentEl.textContent = formatPrice(totalSpent);
    if (completedCountEl) completedCountEl.textContent = completedCount;
    if (pendingAmountEl) pendingAmountEl.textContent = formatPrice(pendingAmount);
}

// ==================================================
// RENDER TRANSACTIONS TABLE
// ==================================================
function renderTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');

    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const filter = statusFilter ? statusFilter.value : 'all';
    const fromDate = fromDateInput && fromDateInput.value ? new Date(fromDateInput.value) : null;
    const toDate = toDateInput && toDateInput.value ? new Date(toDateInput.value) : null;

    const filtered = transactions.filter(t => {
        const seller = String(t.farmer_name || t.seller_name || '').toLowerCase();
        const crop = String(t.crop_name || t.crop || '').toLowerCase();
        const status = String(t.status || '').toLowerCase();

        const matchesSearch = !search || seller.includes(search) || crop.includes(search);
        const matchesStatus = filter === 'all' || status === filter;

        let matchesDate = true;
        if (t.transaction_date) {
            const tDate = new Date(t.transaction_date);
            if (fromDate && tDate < fromDate) matchesDate = false;
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                if (tDate > endOfDay) matchesDate = false;
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">No transactions found.</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(t => {
        const status = String(t.status || '').toLowerCase();
        const isCompleted = status === 'completed';
        const tId = Number(t.id);
        const farmerName = escapeHtml(t.farmer_name || t.seller_name || 'Farmer');

        let actionHtml = '';
        if (isCompleted) {
            actionHtml = `
                <div class="action-group" style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="action-btn receipt-btn" onclick="downloadReceipt(${tId})">
                        <i data-lucide="receipt" style="width:13px;height:13px;"></i> Receipt
                    </button>
                    <button class="action-btn" style="background:#fff8e1;color:#b78103;" onclick="openReviewModal(${tId}, '${farmerName}')">
                        <i data-lucide="star" style="width:13px;height:13px;"></i> Rate Farmer
                    </button>
                    <button class="action-btn" style="background:#fce4ec;color:#c2185b;" onclick="openDisputeModal(${tId})">
                        <i data-lucide="alert-circle" style="width:13px;height:13px;"></i> Dispute
                    </button>
                </div>
            `;
        } else {
            actionHtml = `
                <div class="action-group" style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="action-btn receipt-btn" onclick="downloadReceipt(${tId})">
                        <i data-lucide="receipt" style="width:13px;height:13px;"></i> Receipt
                    </button>
                    <button class="action-btn" style="background:#fce4ec;color:#c2185b;" onclick="openDisputeModal(${tId})">
                        <i data-lucide="alert-circle" style="width:13px;height:13px;"></i> Dispute
                    </button>
                </div>
            `;
        }

        return `
            <tr>
                <td>
                    <div class="transaction-id">TXN-${String(t.id).padStart(5, '0')}</div>
                    <div style="font-size:11px;color:var(--text-muted);">Offer #${escapeHtml(t.offer_id || '-')}</div>
                </td>
                <td>
                    <strong>${farmerName}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(t.farmer_email || '')}</div>
                </td>
                <td>
                    <strong>${escapeHtml(t.crop_name || '-')}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(t.quality ? 'Grade ' + t.quality : '')}</div>
                </td>
                <td>
                    ${Number(t.quantity || 0)} ${escapeHtml(t.unit || 'kg')}
                </td>
                <td>
                    <span class="amount" style="font-weight:600;color:var(--color-primary);">${formatPrice(t.amount)}</span>
                </td>
                <td>
                    ${formatDate(t.transaction_date)}
                </td>
                <td>
                    ${statusBadge(t.status)}
                </td>
                <td>
                    ${actionHtml}
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==================================================
// LOAD TRANSACTIONS
// ==================================================
async function loadTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-state" style="text-align:center;padding:30px;color:var(--text-muted);">
                    Loading transactions...
                </td>
            </tr>
        `;
    }

    try {
        const idToUse = buyerId || 5; // fallback to 5 if testing without login
        const res = await fetch(`${API_BASE}/api/buyer/transactions/${idToUse}`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to load transactions');
        }

        transactions = Array.isArray(data) ? data : (data.transactions || []);

        updateStats();
        renderTransactions();
        await loadTrustScore();

    } catch (err) {
        console.error('Transactions load error:', err);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state" style="text-align:center;padding:30px;color:#c0392b;">
                            <strong>Failed to load transactions</strong><br>
                            <small>${escapeHtml(err.message)}</small>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

// ==================================================
// DISPUTE MODAL & SUBMISSION
// ==================================================
function openDisputeModal(txnId) {
    const modal = document.getElementById('raiseDisputeModal');
    const hiddenId = document.getElementById('disputeTxnId');
    const label = document.getElementById('disputeTxnLabel');

    if (!modal) {
        const issue = prompt(`Raise Dispute on TXN-${String(txnId).padStart(5, '0')}\nEnter issue type (e.g. Quality Mismatch, Damaged Goods, Late Delivery, Weight Discrepancy):`);
        if (!issue) return;
        const desc = prompt('Enter description of the issue:');
        submitDisputeRequest(txnId, issue, desc, 'medium');
        return;
    }

    if (hiddenId) hiddenId.value = txnId;
    if (label) label.textContent = `TXN-${String(txnId).padStart(5, '0')}`;
    modal.style.display = 'flex';
}

function closeDisputeModal() {
    const modal = document.getElementById('raiseDisputeModal');
    if (modal) modal.style.display = 'none';
}

async function submitDisputeRequest(txnId, issueType, description, priority) {
    try {
        const res = await fetch(`${API_BASE}/api/disputes/raise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_id: Number(txnId),
                raised_by_id: Number(buyerId || 5),
                issue_type: issueType,
                description: description,
                priority: priority || 'medium'
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to raise dispute');

        showToast(`Dispute ticket ${data.ticketCode} submitted. Admin will review.`, 'warning');
        closeDisputeModal();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================================================
// REVIEWS & TRUST SCORE MODAL (1 to 5 Stars)
// ==================================================
function openReviewModal(txnId, farmerName) {
    const modal = document.getElementById('rateReviewModal');
    const hiddenId = document.getElementById('reviewTxnId');
    const nameEl = document.getElementById('revieweeNameLabel');

    if (!modal) {
        const rating = prompt(`Rate ${farmerName} (1 to 5 Stars):`, '5');
        if (!rating) return;
        const comment = prompt('Leave optional feedback (Builds Trust Score):');
        submitReviewRequest(txnId, rating, comment);
        return;
    }

    if (hiddenId) hiddenId.value = txnId;
    if (nameEl) nameEl.textContent = farmerName;
    setStarRating(5);
    modal.style.display = 'flex';
}

function closeReviewModal() {
    const modal = document.getElementById('rateReviewModal');
    if (modal) modal.style.display = 'none';
}

function setStarRating(val) {
    selectedRating = val;
    document.querySelectorAll('.star-rating-btn').forEach((btn, idx) => {
        const starNum = idx + 1;
        if (starNum <= val) {
            btn.style.color = '#f39c12';
        } else {
            btn.style.color = '#ccc';
        }
    });
    const ratingText = document.getElementById('selectedRatingText');
    if (ratingText) ratingText.textContent = `${val} out of 5 Stars`;
}

async function submitReviewRequest(txnId, rating, comment) {
    try {
        const res = await fetch(`${API_BASE}/api/reviews/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_id: Number(txnId),
                reviewer_id: Number(buyerId || 5),
                rating: Number(rating),
                comment: comment
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit rating');

        showToast('Rating submitted! Trust score updated.', 'success');
        closeReviewModal();
        await loadTrustScore();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================================================
// DOWNLOAD RECEIPT
// ==================================================
function downloadReceipt(id) {
    const t = transactions.find(item => Number(item.id) === Number(id));
    if (!t) {
        showToast('Transaction not found.', 'error');
        return;
    }

    const txnId = `TXN-${String(t.id).padStart(5, '0')}`;
    const farmer = t.farmer_name || t.seller_name || 'Farmer';
    const crop = t.crop_name || 'Produce';
    const quantity = Number(t.quantity || 0);
    const unit = t.unit || 'kg';
    const date = formatDate(t.transaction_date);

    const receiptContent = `================================================
           AGRILINK AI - OFFICIAL RECEIPT
================================================
Transaction ID : ${txnId}
Date           : ${date}
Status         : ${String(t.status || 'completed').toUpperCase()}

BUYER DETAILS
Name           : ${buyerUser}
ID             : #${buyerId || 5}

SELLER DETAILS
Farmer         : ${farmer}
Email          : ${t.farmer_email || 'N/A'}

PURCHASE SUMMARY
Produce        : ${crop} ${t.quality ? '(Grade ' + t.quality + ')' : ''}
Quantity       : ${quantity} ${unit}
Total Amount   : ${formatPrice(t.amount)}

Thank you for choosing AgriLink AI Verified Marketplace.
Platform Certified & Transparent Agriculture.
================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${txnId}-receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==================================================
// EXPORT CSV
// ==================================================
function exportCSV() {
    if (!transactions.length) {
        showToast('No transactions to export.', 'warning');
        return;
    }

    const headers = ['Transaction ID', 'Date', 'Seller', 'Produce', 'Quantity', 'Amount (INR)', 'Status'];
    const rows = transactions.map(t => [
        `TXN-${String(t.id).padStart(5, '0')}`,
        formatDate(t.transaction_date),
        `"${t.farmer_name || ''}"`,
        `"${t.crop_name || ''}"`,
        `"${t.quantity || 0} ${t.unit || 'kg'}"`,
        t.amount || 0,
        t.status || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buyer-transactions-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==================================================
// FORM EVENT LISTENERS
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (searchInput) searchInput.addEventListener('input', renderTransactions);
    if (statusFilter) statusFilter.addEventListener('change', renderTransactions);
    if (fromDate) fromDate.addEventListener('change', renderTransactions);
    if (toDate) toDate.addEventListener('change', renderTransactions);
    if (refreshBtn) refreshBtn.addEventListener('click', loadTransactions);
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);

    const disputeForm = document.getElementById('raiseDisputeForm');
    if (disputeForm) {
        disputeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const txnId = document.getElementById('disputeTxnId').value;
            const issueType = document.getElementById('disputeIssueType').value;
            const priority = document.getElementById('disputePriority').value;
            const description = document.getElementById('disputeDescription').value;
            submitDisputeRequest(txnId, issueType, description, priority);
        });
    }

    const reviewForm = document.getElementById('rateReviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const txnId = document.getElementById('reviewTxnId').value;
            const comment = document.getElementById('reviewCommentInput').value;
            submitReviewRequest(txnId, selectedRating, comment);
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});
