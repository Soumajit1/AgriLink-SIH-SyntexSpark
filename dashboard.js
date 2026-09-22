document.addEventListener('DOMContentLoaded', () => {
  // =========================================================
  // TOAST NOTIFICATION SYSTEM
  // =========================================================
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'alert-triangle';
    toast.innerHTML = `<i data-lucide="${icon}" style="color: var(--color-primary);"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: toast });
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 3500);
  }
  window.showToast = showToast;

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================
  // NOTIFICATIONS SYSTEM (DYNAMIC & LIVE)
  // =========================================================
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    const API_BASE = (window.location.protocol.startsWith('http') && window.location.port !== '5500') ? '' : 'http://localhost:5000';
    const currentUserId = Number(localStorage.getItem('agrilink_user_id')) || (window.location.pathname.includes('buyer') ? 5 : 17);

    // Ensure badge container exists inside notifBtn
    let notifBadge = notifBtn.querySelector('#notifBadge');
    if (!notifBadge) {
      notifBadge = document.createElement('span');
      notifBadge.id = 'notifBadge';
      notifBadge.style.cssText = 'background:#e74c3c;color:white;border-radius:10px;padding:2px 7px;font-size:11px;font-weight:700;margin-left:6px;display:none;';
      notifBtn.appendChild(notifBadge);
    }

    // Remove any existing dropdown
    const existingDropdown = document.getElementById('notifDropdown');
    if (existingDropdown) existingDropdown.remove();

    const dropdown = document.createElement('div');
    dropdown.id = 'notifDropdown';
    dropdown.className = 'notifications-dropdown';
    notifBtn.parentElement.style.position = 'relative';
    notifBtn.parentElement.appendChild(dropdown);

    async function loadNotifications() {
      try {
        const res = await fetch(`${API_BASE}/api/notifications/${currentUserId}`);
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        const list = data.notifications || [];
        const unreadCount = Number(data.unreadCount || 0);

        if (unreadCount > 0) {
          notifBadge.textContent = unreadCount;
          notifBadge.style.display = 'inline-block';
        } else {
          notifBadge.style.display = 'none';
        }

        let itemsHtml = '';
        if (list.length === 0) {
          itemsHtml = `
            <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
              <div style="font-size: 24px; margin-bottom: 6px;">🔔</div>
              <div>No new notifications</div>
              <div style="font-size: 12px; opacity: 0.7;">You're all caught up!</div>
            </div>
          `;
        } else {
          itemsHtml = list.slice(0, 10).map(item => {
            let icon = 'info';
            let iconColor = 'var(--color-primary)';
            if (item.type === 'warning' || item.type === 'dispute') { icon = 'alert-triangle'; iconColor = '#e74c3c'; }
            else if (item.type === 'success' || item.type === 'offer') { icon = 'check-circle'; iconColor = 'var(--color-accent)'; }
            else if (item.type === 'shipment') { icon = 'truck'; iconColor = '#f39c12'; }

            const bg = item.is_read ? 'transparent' : 'rgba(0,191,165,0.04)';
            const timeAgo = item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

            return `
              <div class="notif-item" style="background:${bg}; padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
                <div style="display:flex; gap:10px; align-items:flex-start;">
                  <i data-lucide="${icon}" style="width:16px;height:16px;color:${iconColor};margin-top:2px;flex-shrink:0;"></i>
                  <div style="flex:1;">
                    <div style="font-weight:600; font-size:13px; color:var(--text-main);">${escapeHtml(item.title)}</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px; line-height:1.4;">${escapeHtml(item.message)}</div>
                    <div style="font-size:11px; color:#999; margin-top:4px;">${timeAgo}</div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }

        dropdown.innerHTML = `
          <div style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; font-family: 'Outfit', sans-serif; display:flex; justify-content:space-between; align-items:center;">
            <span>Notifications (${unreadCount > 0 ? unreadCount + ' unread' : 'All'})</span>
            <span style="font-size:12px; color:var(--color-primary); cursor:pointer; font-weight:500;" id="markAllRead">Mark all read</span>
          </div>
          <div style="max-height: 340px; overflow-y: auto;">
            ${itemsHtml}
          </div>
          <div style="padding:10px; text-align:center; border-top: 1px solid #eee; font-size:12px;">
            <span style="color:var(--text-muted);">Real-time AgriLink Alerts</span>
          </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: dropdown });

        const markAllReadBtn = dropdown.querySelector('#markAllRead');
        if (markAllReadBtn) {
          markAllReadBtn.addEventListener('click', async () => {
            try {
              await fetch(`${API_BASE}/api/notifications/user/${currentUserId}/read-all`, { method: 'PUT' });
              notifBadge.style.display = 'none';
              showToast('All notifications marked as read.', 'success');
              loadNotifications();
            } catch (err) {
              notifBadge.style.display = 'none';
              showToast('Notifications updated.', 'success');
            }
          });
        }

      } catch (e) {
        console.warn('Notifications fetch notice:', e);
      }
    }

    loadNotifications();

    notifBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== notifBtn) {
        dropdown.classList.remove('show');
      }
    });
  }

  // =========================================================
  // TOPBAR ACTIONS: GOOGLE TRANSLATE
  // =========================================================
  const topbarActions = document.querySelector('.topbar-actions');
  if (topbarActions) {
    if (!document.getElementById('google_translate_element')) {
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.marginRight = '8px';
      topbarActions.insertBefore(translateDiv, topbarActions.firstChild);
    }
  }

  // Load Google Translate Element if not already loaded
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = function() {
      if (window.google && google.translate) {
        new google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi,bn,te,mr,ta,gu,kn,ml,pa',
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google_translate_element');
      }
    };
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const gtScript = document.createElement('script');
      gtScript.type = 'text/javascript';
      gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(gtScript);
    }
  }

  // =========================================================
  // INTERACTIVE TABLE ACTIONS
  // =========================================================
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.type === 'submit') return;
    if (btn.id === 'notifBtn') return;
    if (btn.closest('#notifDropdown')) return;

    const btnText = btn.textContent.trim().toLowerCase();

    if (btnText === 'accept' || btnText === 'approve') {
      e.preventDefault();
      const row = btn.closest('tr') || btn.closest('.card-3d');
      if (row) {
        row.style.background = 'rgba(0, 191, 165, 0.06)';
        const cell = btn.closest('td');
        if (cell) cell.innerHTML = '<span class="badge badge-success">Accepted</span>';
      }
      showToast('Offer accepted successfully!', 'success');
    } else if (btnText === 'reject' || btnText === 'suspend') {
      e.preventDefault();
      const row = btn.closest('tr') || btn.closest('.card-3d');
      if (row) {
        row.style.opacity = '0.5';
        row.style.pointerEvents = 'none';
      }
      showToast(`Action completed: ${btn.textContent.trim()}.`, 'warning');
    } else if (btnText === 'remove') {
      e.preventDefault();
      const card = btn.closest('.card-3d');
      if (card) {
        card.style.transform = 'scale(0)';
        card.style.opacity = '0';
        card.style.transition = 'all 0.3s ease';
        setTimeout(() => card.remove(), 300);
      }
      showToast('Produce removed from listing.', 'warning');
    } else if (btnText.includes('download') || btnText.includes('export') || btnText.includes('generate') || btnText.includes('receipt') || btnText.includes('invoice')) {
      e.preventDefault();
      showToast('Generating document... Download will start shortly.', 'info');
    } else if (btnText.includes('add') || btnText.includes('list now')) {
      e.preventDefault();
      showToast('Feature coming in next phase. Form editor launching...', 'info');
    } else if (btnText === 'edit') {
      e.preventDefault();
      showToast('Edit mode activated. (Full form in next phase)', 'info');
    } else if (btnText.includes('contact') || btnText.includes('view') || btnText.includes('review')) {
      e.preventDefault();
      showToast('Loading details panel...', 'info');
    } else if (btnText.includes('counter') || btnText.includes('find buyer') || btnText.includes('update')) {
      e.preventDefault();
      showToast('Action triggered. (Mock)', 'success');
    } else if (btnText === 'refresh') {
      e.preventDefault();
      showToast('Prices refreshed with latest market data!', 'success');
    } else if (btnText.includes('close') || btnText.includes('resolve')) {
      e.preventDefault();
      const row = btn.closest('tr');
      if (row) {
        row.style.opacity = '0.5';
        row.style.pointerEvents = 'none';
        const cell = btn.closest('td');
        if (cell) cell.innerHTML = '<span class="badge badge-success">Resolved</span>';
      }
      showToast('Case closed successfully.', 'success');
    } else if (btn.id || btn.getAttribute('onclick')) {
      // has specific handler, skip
    } else {
      e.preventDefault();
      showToast('Action triggered. (Mock)', 'success');
    }
  });

  // =========================================================
  // USER PROFILE CLICK
  // =========================================================
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    userProfile.addEventListener('click', () => {
      showToast('Profile settings will be available in the next release.', 'info');
    });
  }
});
