const API_BASE = (window.location.protocol.startsWith('http') && window.location.port !== '5500') ? '' : 'http://localhost:5000';

const farmerId = Number(localStorage.getItem('agrilink_user_id'));
const farmerUser = localStorage.getItem('agrilink_user') || 'Farmer';

let shipments = [];
let unshippedTransactions = [];

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

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function statusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'delivered') {
        return '<span class="badge badge-success">Delivered</span>';
    }
    if (s === 'in_transit') {
        return '<span class="badge badge-warning" style="background:rgba(243,156,18,0.15);color:#d35400;">In Transit</span>';
    }
    if (s === 'cancelled') {
        return '<span class="badge badge-danger">Cancelled</span>';
    }
    return '<span class="badge" style="background:#e3f2fd;color:#1565c0;">Pending Dispatch</span>';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3200);
}

// ==================================================
// LOAD STATS
// ==================================================

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/api/farmer/logistics/${farmerId}/stats`);
        if (!res.ok) return;

        const stats = await res.json();

        const totalEl = document.getElementById('totalShipments');
        const inTransitEl = document.getElementById('inTransitShipments');
        const deliveredEl = document.getElementById('deliveredShipments');
        const pendingEl = document.getElementById('pendingShipments');

        if (totalEl) totalEl.textContent = stats.total || 0;
        if (inTransitEl) inTransitEl.textContent = stats.in_transit || 0;
        if (deliveredEl) deliveredEl.textContent = stats.delivered || 0;
        if (pendingEl) pendingEl.textContent = stats.pending || 0;

    } catch (err) {
        console.error('Logistics stats error:', err);
    }
}

// ==================================================
// RENDER ACTIVE SHIPMENT CARDS
// ==================================================

function renderActiveShipments() {
    const container = document.getElementById('activeShipmentsContainer');
    if (!container) return;

    const activeList = shipments.filter(s => {
        const st = String(s.status || '').toLowerCase();
        return st === 'pending' || st === 'in_transit';
    });

    if (activeList.length === 0) {
        container.innerHTML = `
            <div class="empty-state glass-panel" style="padding:40px 20px;text-align:center;border-radius:12px;background:var(--bg-surface);">
                <i data-lucide="package-check" style="width:40px;height:40px;color:var(--color-primary);margin-bottom:12px;"></i>
                <div style="font-weight:600;font-size:16px;">No Active Shipments</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">All shipments have been delivered or none are pending. You can create a new shipment below.</div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = activeList.map(s => {
        const isPending = s.status === 'pending';
        const isInTransit = s.status === 'in_transit';

        const progressPercent = isPending ? 25 : 65;
        const trackingNum = s.tracking_number || `SHP-${String(s.id).padStart(4, '0')}`;
        const crop = s.crop_name ? `${s.crop_name} (${Number(s.transaction_quantity || 0)} ${s.unit || 'kg'})` : 'Agricultural Produce';
        const buyer = s.buyer_name || 'Registered Buyer';
        const pickup = s.pickup_location || 'Farmer Location';
        const destination = s.delivery_location || 'Buyer Address';
        const transporter = s.transporter || 'Self / Local Transport';

        let actionBtns = '';
        if (isPending) {
            actionBtns = `
                <button class="action-btn" style="background:#16834b;color:white;" onclick="updateStatus(${s.id}, 'in_transit')">
                    <i data-lucide="truck" style="width:14px;height:14px;"></i> Mark In Transit
                </button>
                <button class="action-btn" style="background:#dc3545;color:white;" onclick="updateStatus(${s.id}, 'cancelled')">
                    <i data-lucide="x" style="width:14px;height:14px;"></i> Cancel
                </button>
            `;
        } else if (isInTransit) {
            actionBtns = `
                <button class="action-btn" style="background:#2e7d32;color:white;" onclick="updateStatus(${s.id}, 'delivered')">
                    <i data-lucide="check-check" style="width:14px;height:14px;"></i> Confirm Delivered
                </button>
            `;
        }

        return `
            <div class="shipment-card">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
                    <div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <h3 style="margin:0;font-family:'Outfit',sans-serif;font-size:18px;">${escapeHtml(trackingNum)}</h3>
                            <span style="font-size:12px;color:var(--text-muted);">Txn #${s.transaction_id}</span>
                        </div>
                        <p style="font-size:14px;color:var(--text-muted);margin:4px 0 0;">
                            <strong>${escapeHtml(crop)}</strong> &rarr; ${escapeHtml(buyer)}
                        </p>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${statusBadge(s.status)}
                    </div>
                </div>

                <!-- Progress Track -->
                <div class="progress-track">
                    <div class="progress-fill" style="width:${progressPercent}%;"></div>
                    <div class="progress-dots">
                        <div class="progress-dot"></div>
                        <div class="progress-dot ${isInTransit ? '' : 'inactive'}"></div>
                        <div class="progress-dot inactive"></div>
                    </div>
                </div>
                <div class="progress-labels" style="margin-top:8px;">
                    <span>Dispatched<br><strong>${formatDate(s.created_at)}</strong></span>
                    <span style="text-align:center;">In Transit<br><strong>${isInTransit ? 'Active' : 'Pending'}</strong></span>
                    <span style="text-align:right;">Estimated Delivery<br><strong>${formatDate(s.estimated_delivery)}</strong></span>
                </div>

                <!-- Details Grid -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:20px;padding-top:16px;border-top:1px solid #eee;">
                    <div>
                        <p style="font-size:12px;color:var(--text-muted);margin:0 0 2px;">Pickup From</p>
                        <p style="font-weight:600;margin:0;font-size:13px;">${escapeHtml(pickup)}</p>
                    </div>
                    <div>
                        <p style="font-size:12px;color:var(--text-muted);margin:0 0 2px;">Delivery Address</p>
                        <p style="font-weight:600;margin:0;font-size:13px;">${escapeHtml(destination)}</p>
                    </div>
                    <div>
                        <p style="font-size:12px;color:var(--text-muted);margin:0 0 2px;">Transporter / Tracking</p>
                        <p style="font-weight:600;margin:0;font-size:13px;">${escapeHtml(transporter)}</p>
                    </div>
                </div>

                <!-- Action Footer -->
                <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;padding-top:14px;border-top:1px dashed #eee;">
                    ${actionBtns}
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==================================================
// RENDER SHIPMENTS HISTORY TABLE
// ==================================================

function renderShipmentsTable() {
    const tbody = document.getElementById('shipmentsTableBody');
    if (!tbody) return;

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const filter = statusFilter ? statusFilter.value : 'all';

    const filtered = shipments.filter(s => {
        const tracking = String(s.tracking_number || `SHP-${s.id}`).toLowerCase();
        const buyer = String(s.buyer_name || '').toLowerCase();
        const crop = String(s.crop_name || '').toLowerCase();
        const status = String(s.status || '').toLowerCase();

        const matchesSearch = !search || tracking.includes(search) || buyer.includes(search) || crop.includes(search);
        const matchesStatus = filter === 'all' || status === filter;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state" style="text-align:center;padding:30px;color:var(--text-muted);">
                        No shipment records found.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const trackingNum = s.tracking_number || `SHP-${String(s.id).padStart(4, '0')}`;
        const crop = s.crop_name ? `${s.crop_name} (${Number(s.transaction_quantity || 0)} ${s.unit || 'kg'})` : '—';
        const route = `${escapeHtml(s.pickup_location || 'Origin')} &rarr; ${escapeHtml(s.delivery_location || 'Destination')}`;

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(trackingNum)}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">Txn #${s.transaction_id}</div>
                </td>
                <td>
                    <strong>${escapeHtml(s.buyer_name || 'Buyer')}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(s.buyer_email || '')}</div>
                </td>
                <td>
                    ${escapeHtml(crop)}
                </td>
                <td style="max-width:220px;font-size:13px;">
                    ${route}
                </td>
                <td>
                    ${formatDate(s.created_at)}
                </td>
                <td>
                    ${statusBadge(s.status)}
                </td>
                <td>
                    ${s.status === 'delivered' ? `
                        <span style="font-size:12px;color:var(--color-primary);font-weight:600;">
                            <i data-lucide="check-circle" style="width:13px;height:13px;display:inline;"></i> Completed
                        </span>
                    ` : `
                        <button class="action-btn" style="padding:4px 8px;font-size:11px;background:#f1f3f5;color:#333;" onclick="openStatusModal(${s.id}, '${s.status}')">
                            Update
                        </button>
                    `}
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==================================================
// LOAD SHIPMENTS
// ==================================================

async function loadShipments() {
    const activeContainer = document.getElementById('activeShipmentsContainer');
    const tbody = document.getElementById('shipmentsTableBody');

    if (activeContainer && shipments.length === 0) {
        activeContainer.innerHTML = '<div class="loading-state" style="text-align:center;padding:30px;color:var(--text-muted);">Loading active shipments...</div>';
    }
    if (tbody && shipments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-state" style="text-align:center;padding:30px;color:var(--text-muted);">Loading shipments...</td></tr>';
    }

    try {
        const res = await fetch(`${API_BASE}/api/farmer/logistics/${farmerId}`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to load shipments');
        }

        shipments = data.shipments || [];

        renderActiveShipments();
        renderShipmentsTable();
        await loadStats();

    } catch (err) {
        console.error('Shipments load error:', err);
        if (activeContainer) {
            activeContainer.innerHTML = `<div class="empty-state" style="padding:30px;text-align:center;color:#c0392b;">Failed to load shipments: ${escapeHtml(err.message)}</div>`;
        }
    }
}

// ==================================================
// UPDATE SHIPMENT STATUS
// ==================================================

async function updateStatus(shipmentId, newStatus) {
    const actionName = newStatus === 'delivered' ? 'mark this shipment as DELIVERED' : (newStatus === 'in_transit' ? 'mark this shipment as IN TRANSIT' : 'CANCEL this shipment');
    if (!confirm(`Are you sure you want to ${actionName}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/api/farmer/logistics/${shipmentId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                farmerId: Number(farmerId),
                status: newStatus
            })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to update status');
        }

        showToast(`Shipment status updated to ${newStatus.replace('_', ' ')}.`);
        await loadShipments();

    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

// ==================================================
// CREATE SHIPMENT MODAL & ACTIONS
// ==================================================

async function openCreateShipmentModal() {
    const modal = document.getElementById('createShipmentModal');
    const select = document.getElementById('transactionSelect');
    if (!modal || !select) return;

    select.innerHTML = '<option value="">Loading eligible transactions...</option>';
    modal.style.display = 'flex';

    try {
        const res = await fetch(`${API_BASE}/api/farmer/logistics/${farmerId}/unshipped`);
        const data = await res.json();

        unshippedTransactions = data.transactions || [];

        if (unshippedTransactions.length === 0) {
            select.innerHTML = '<option value="">No unshipped transactions available</option>';
            return;
        }

        select.innerHTML = '<option value="">-- Choose a transaction to ship --</option>' +
            unshippedTransactions.map(t => {
                const crop = t.crop_name ? `${t.crop_name} (${t.quantity} ${t.unit || 'kg'})` : `Txn #${t.transaction_id}`;
                const buyer = t.buyer_name || 'Buyer';
                return `<option value="${t.transaction_id}">${crop} &rarr; ${buyer} (Txn #${t.transaction_id})</option>`;
            }).join('');

    } catch (err) {
        console.error('Error loading unshipped transactions:', err);
        select.innerHTML = '<option value="">Failed to load transactions</option>';
    }
}

function closeCreateShipmentModal() {
    const modal = document.getElementById('createShipmentModal');
    if (modal) modal.style.display = 'none';
}

async function handleCreateShipmentSubmit(e) {
    e.preventDefault();

    const transactionId = document.getElementById('transactionSelect').value;
    const pickupLocation = document.getElementById('pickupInput').value.trim();
    const deliveryLocation = document.getElementById('deliveryInput').value.trim();
    const transporter = document.getElementById('transporterInput').value.trim();
    const trackingNumber = document.getElementById('trackingInput').value.trim();
    const estimatedDelivery = document.getElementById('estimatedDateInput').value;

    if (!transactionId) {
        alert('Please select a transaction to ship.');
        return;
    }
    if (!pickupLocation) {
        alert('Please enter a pickup location.');
        return;
    }
    if (!deliveryLocation) {
        alert('Please enter a delivery location.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/farmer/logistics/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_id: Number(transactionId),
                pickup_location: pickupLocation,
                delivery_location: deliveryLocation,
                transporter: transporter || null,
                tracking_number: trackingNumber || null,
                estimated_delivery: estimatedDelivery || null
            })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to create shipment');
        }

        showToast('Shipment created successfully!');
        closeCreateShipmentModal();
        e.target.reset();
        await loadShipments();

    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

function openStatusModal(shipmentId, currentStatus) {
    const newStatus = prompt(
        `Update shipment status for #${shipmentId}\nEnter: in_transit, delivered, or cancelled:`,
        currentStatus === 'pending' ? 'in_transit' : 'delivered'
    );
    if (!newStatus) return;

    const trimmed = newStatus.trim().toLowerCase();
    if (!['pending', 'in_transit', 'delivered', 'cancelled'].includes(trimmed)) {
        alert('Invalid status. Allowed values: pending, in_transit, delivered, cancelled');
        return;
    }

    updateStatus(shipmentId, trimmed);
}

// ==================================================
// INITIALIZATION
// ==================================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const newShipmentBtn = document.getElementById('newShipmentBtn');
    const createForm = document.getElementById('createShipmentForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (searchInput) searchInput.addEventListener('input', renderShipmentsTable);
    if (statusFilter) statusFilter.addEventListener('change', renderShipmentsTable);
    if (refreshBtn) refreshBtn.addEventListener('click', loadShipments);
    if (newShipmentBtn) newShipmentBtn.addEventListener('click', openCreateShipmentModal);
    if (createForm) createForm.addEventListener('submit', handleCreateShipmentSubmit);

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

    loadShipments();

    if (window.lucide) {
        lucide.createIcons();
    }
});
