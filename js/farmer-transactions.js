const API_BASE = (window.location.protocol.startsWith('http') && window.location.port !== '5500') ? '' : 'http://localhost:5000';

const farmerId = Number(localStorage.getItem('agrilink_user_id'));
const farmerUser = localStorage.getItem('agrilink_user') || 'Farmer';

let transactions = [];
let selectedRating = 5;

// ==================================================
// SESSION VALIDATION
// ==================================================
if (!farmerId) {
    alert('Farmer session not found. Please login again.');
    window.location.href = 'index.html';
}

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
    try {
        const res = await fetch(`${API_BASE}/api/reviews/user/${farmerId}`);
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
// RENDER TRANSACTIONS TABLE
// ==================================================
function renderTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const filter = statusFilter ? statusFilter.value : 'all';

    const filtered = transactions.filter(t => {
        const buyer = String(t.buyer_name || t.buyer || '').toLowerCase();
        const crop = String(t.crop_name || t.crop || '').toLowerCase();
        const status = String(t.status || '').toLowerCase();

        const matchesSearch = !search || buyer.includes(search) || crop.includes(search);
        const matchesStatus = filter === 'all' || status === filter;

        return matchesSearch && matchesStatus;
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
        const isPending = status === 'pending';
        const tId = Number(t.id);
        const buyerName = escapeHtml(t.buyer_name || t.buyer || 'Buyer');

        let actionHtml = '';
        if (isPending) {
            actionHtml = `
                <div class="action-group">
                    <button class="action-btn complete-btn" onclick="completeTransaction(${tId})">
                        <i data-lucide="check" style="width:13px;height:13px;"></i> Complete
                    </button>
                    <button class="action-btn cancel-btn" onclick="cancelTransaction(${tId})">
                        <i data-lucide="x" style="width:13px;height:13px;"></i> Cancel
                    </button>
                    <button class="action-btn" style="background:#fce4ec;color:#c2185b;" onclick="openDisputeModal(${tId})">
                        <i data-lucide="alert-circle" style="width:13px;height:13px;"></i> Dispute
                    </button>
                </div>
            `;
        } else {
            actionHtml = `
                <div class="action-group">
                    <button class="action-btn receipt-btn" onclick="downloadReceipt(${tId})">
                        <i data-lucide="receipt" style="width:13px;height:13px;"></i> Receipt
                    </button>
                    <button class="action-btn" style="background:#fff8e1;color:#b78103;" onclick="openReviewModal(${tId}, '${buyerName}')">
                        <i data-lucide="star" style="width:13px;height:13px;"></i> Rate Buyer
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
                    <strong>${buyerName}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(t.buyer_email || '')}</div>
                </td>
                <td>
                    <strong>${escapeHtml(t.crop_name || t.crop || '-')}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(t.quality ? 'Grade ' + t.quality : '')}</div>
                </td>
                <td>
                    ${Number(t.quantity || 0)} ${escapeHtml(t.unit || 'kg')}
                </td>
                <td>
                    <span class="amount">${formatPrice(t.amount)}</span>
                </td>
                <td>
                    ${formatDate(t.transaction_date || t.created_at)}
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
// LOAD STATS & TRANSACTIONS
// ==================================================
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/api/farmer/transactions/${farmerId}/stats`);
        if (!res.ok) return;

        const data = await res.json();
        const stats = data.stats || data || {};

        const totalEl = document.getElementById('totalTransactions');
        const pendingEl = document.getElementById('pendingTransactions');
        const completedEl = document.getElementById('completedTransactions');
        const amountEl = document.getElementById('completedAmount');

        if (totalEl) totalEl.textContent = stats.total || 0;
        if (pendingEl) pendingEl.textContent = stats.pending || 0;
        if (completedEl) completedEl.textContent = stats.completed || 0;
        if (amountEl) amountEl.textContent = formatPrice(stats.completedAmount || 0);

    } catch (err) {
        console.error('Stats load error:', err);
    }
}

async function loadTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-state">
                    Loading transactions...
                </td>
            </tr>
        `;
    }

    try {
        const res = await fetch(`${API_BASE}/api/farmer/transactions/${farmerId}`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to load transactions');
        }

        transactions = Array.isArray(data) ? data : (data.transactions || []);

        renderTransactions();
        await loadStats();
        await loadTrustScore();

    } catch (err) {
        console.error('Transactions load error:', err);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
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
// ACTIONS: COMPLETE & CANCEL
// ==================================================
async function completeTransaction(id) {
    if (!confirm('Mark this transaction as completed?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/farmer/transactions/${id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ farmerId: Number(farmerId) })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to complete transaction');

        showToast('Transaction completed successfully.');
        await loadTransactions();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function cancelTransaction(id) {
    if (!confirm('Cancel this transaction?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/farmer/transactions/${id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ farmerId: Number(farmerId) })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to cancel transaction');

        showToast('Transaction cancelled.', 'error');
        await loadTransactions();
    } catch (err) {
        showToast(err.message, 'error');
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
        // Fallback prompt
        const issue = prompt(`Raise Dispute on TXN-${String(txnId).padStart(5, '0')}\nEnter issue type (e.g. Payment Delay, Quality Mismatch, Damaged Goods):`);
        if (!issue) return;
        const desc = prompt('Enter a brief description of the problem:');
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
                raised_by_id: Number(farmerId),
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
function openReviewModal(txnId, revieweeName) {
    const modal = document.getElementById('rateReviewModal');
    const hiddenId = document.getElementById('reviewTxnId');
    const nameEl = document.getElementById('revieweeNameLabel');

    if (!modal) {
        const rating = prompt(`Rate ${revieweeName} (1 to 5 Stars):`, '5');
        if (!rating) return;
        const comment = prompt('Leave optional feedback (Trust Score):');
        submitReviewRequest(txnId, rating, comment);
        return;
    }

    if (hiddenId) hiddenId.value = txnId;
    if (nameEl) nameEl.textContent = revieweeName;
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
                reviewer_id: Number(farmerId),
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
    const buyer = t.buyer_name || t.buyer || 'Buyer';
    const crop = t.crop_name || t.crop || 'Produce';
    const quantity = Number(t.quantity || 0);
    const unit = t.unit || 'kg';
    const date = formatDate(t.transaction_date || t.created_at);

    const receiptContent = `================================================
           AgriLink AI - SALE RECEIPT
================================================
Transaction ID : ${txnId}
Date           : ${date}
Status         : ${String(t.status).toUpperCase()}
------------------------------------------------
SELLER (Farmer): ${farmerUser} (ID: ${farmerId})
BUYER          : ${buyer} (${t.buyer_email || 'N/A'})
------------------------------------------------
PRODUCE        : ${crop}
QUANTITY       : ${quantity} ${unit}
TOTAL AMOUNT   : ${formatPrice(t.amount)}
================================================
    Thank you for choosing AgriLink AI!
================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${txnId}-receipt.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ==================================================
// EVENT LISTENERS & INIT
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (searchInput) searchInput.addEventListener('input', renderTransactions);
    if (statusFilter) statusFilter.addEventListener('change', renderTransactions);
    if (refreshBtn) refreshBtn.addEventListener('click', loadTransactions);

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('agrilink_token');
            localStorage.removeItem('agrilink_role');
            localStorage.removeItem('agrilink_user');
            localStorage.removeItem('agrilink_email');
            localStorage.removeItem('agrilink_user_id');
            window.location.href = 'index.html';
        });
    }

    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');

    if (userNameEl) userNameEl.textContent = farmerUser;
    if (userAvatarEl) userAvatarEl.textContent = farmerUser.charAt(0).toUpperCase();

    // Dispute Form Listener
    const disputeForm = document.getElementById('raiseDisputeForm');
    if (disputeForm) {
        disputeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('disputeTxnId').value;
            const issue = document.getElementById('disputeIssueType').value;
            const desc = document.getElementById('disputeDescription').value.trim();
            const priority = document.getElementById('disputePriority').value;
            submitDisputeRequest(id, issue, desc, priority);
        });
    }

    // Review Form Listener
    const reviewForm = document.getElementById('rateReviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('reviewTxnId').value;
            const comment = document.getElementById('reviewCommentInput').value.trim();
            submitReviewRequest(id, selectedRating, comment);
        });
    }

    loadTransactions();

    if (window.lucide) {
        lucide.createIcons();
    }
});
