/**
 * app.js — Main Application Controller
 * Handles navigation, filter bar, initialization, toasts, and modals.
 */

const App = (() => {
  let currentTab = 'leaderboard';

  // ─── Initialize ───
  function init() {
    Storage.init();
    setupNavigation();
    setupFilterBar();
    setupModal();

    // Initialize all modules
    Auth.init();
    Leaderboard.init();
    Cards.init();
    Profile.init();
    Events.init();
    Admin.init();

    // Show default tab
    switchTab('leaderboard');
    updateSessionUI();
  }

  // ─── Navigation ───
  function setupNavigation() {
    const hamburger = document.getElementById('pillHamburger');
    const mobileMenu = document.getElementById('pillMobileMenu');

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close mobile menu if clicked outside
      document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
          mobileMenu.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Both desktop pill-nav buttons and mobile menu buttons
    document.querySelectorAll('.pill-nav-btn, .pill-mobile-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
        if (mobileMenu) {
          mobileMenu.classList.remove('open');
          if (hamburger) {
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });

    window.addEventListener('resize', updatePillIndicator);
    if (document.fonts) {
      document.fonts.ready.then(updatePillIndicator);
    }
  }

  function updatePillIndicator() {
    const activeBtn = document.querySelector(`.pill-nav-btn[data-tab="${currentTab}"]`);
    const indicator = document.getElementById('pillIndicator');
    const nav = document.getElementById('pillNav');
    if (!indicator || !nav) return;

    if (!activeBtn) {
      indicator.style.opacity = '0';
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    if (btnRect.width === 0) return; // Hidden on mobile

    const left = btnRect.left - navRect.left;
    const width = btnRect.width;

    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
    indicator.style.opacity = '1';
  }

  function switchTab(tab) {
    currentTab = tab;

    // Update pill-nav-btn and pill-mobile-btn
    document.querySelectorAll('.pill-nav-btn, .pill-mobile-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update header My Profile and Admin buttons active highlight
    const headerProfileBtn = document.getElementById('headerProfileBtn');
    if (headerProfileBtn) {
      headerProfileBtn.classList.toggle('active', tab === 'profile');
    }
    const headerAdminBtn = document.getElementById('headerAdminBtn');
    if (headerAdminBtn) {
      headerAdminBtn.classList.toggle('active', tab === 'admin');
    }

    updatePillIndicator();

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tab}`);
    });

    // Show/hide filter bar (only for leaderboard and cards)
    const filterBar = document.getElementById('filterBar');
    const mainContent = document.querySelector('.main-content');
    const sortItem = document.getElementById('filterSortItem');
    const layoutItem = document.getElementById('filterLayoutItem');

    if (tab === 'leaderboard' || tab === 'cards') {
      filterBar.classList.remove('hidden');
      mainContent.classList.remove('no-filter');
      if (sortItem) sortItem.style.display = tab === 'cards' ? '' : 'none';
      if (layoutItem) layoutItem.style.display = tab === 'cards' ? '' : 'none';
    } else {
      filterBar.classList.add('hidden');
      mainContent.classList.add('no-filter');
    }

    // Refresh the view data
    if (tab === 'leaderboard') Leaderboard.render();
    if (tab === 'cards') Cards.render();
    if (tab === 'profile') Profile.render();
    if (tab === 'events') Events.render();
    if (tab === 'admin') Admin.render();
  }

  // ─── Filter Bar ───
  function setupFilterBar() {
    const sportSelect = document.getElementById('filterSport');
    const categorySelect = document.getElementById('filterCategory');
    const gradeSelect = document.getElementById('filterGrade');
    const toggleBtn = document.getElementById('filterToggleBtn');
    const dropdowns = document.getElementById('filterDropdowns');
    const resetBtn = document.getElementById('resetFilterBtn');

    // Mobile filter toggle
    if (toggleBtn && dropdowns) {
      toggleBtn.addEventListener('click', () => {
        const isShown = dropdowns.classList.toggle('show');
        toggleBtn.classList.toggle('active', isShown);
        toggleBtn.setAttribute('aria-expanded', isShown ? 'true' : 'false');
      });
    }

    // Reset filters button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        document.getElementById('filterSearch').value = '';
        sportSelect.value = 'All';
        updateCategoryFilter();
        categorySelect.value = 'All';
        gradeSelect.value = 'All';
        applyFilters();
        showToast('Filters reset', 'info');
      });
    }

    // Populate sports dropdown
    populateSportFilter();

    // Populate grade dropdown
    Storage.getGradeLevels().forEach(grade => {
      const opt = document.createElement('option');
      opt.value = grade;
      opt.textContent = grade;
      gradeSelect.appendChild(opt);
    });

    // Sport change → update categories
    sportSelect.addEventListener('change', () => {
      updateCategoryFilter();
      applyFilters();
    });

    // All filter changes
    categorySelect.addEventListener('change', applyFilters);
    gradeSelect.addEventListener('change', applyFilters);

    // Search with debounce
    let searchTimeout;
    document.getElementById('filterSearch').addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 300);
    });
  }

  function populateSportFilter() {
    const sportSelect = document.getElementById('filterSport');
    const currentVal = sportSelect.value;

    // Clear except "All"
    while (sportSelect.options.length > 1) sportSelect.remove(1);

    Storage.getSportsConfig().forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.sport;
      opt.textContent = s.sport;
      sportSelect.appendChild(opt);
    });

    sportSelect.value = currentVal || 'All';
    updateCategoryFilter();
  }

  function updateCategoryFilter() {
    const sport = document.getElementById('filterSport').value;
    const catSelect = document.getElementById('filterCategory');
    const currentVal = catSelect.value;

    // Clear except "All"
    while (catSelect.options.length > 1) catSelect.remove(1);

    if (sport && sport !== 'All') {
      const categories = Storage.getCategoriesForSport(sport);
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
    }

    catSelect.value = currentVal || 'All';
  }

  function getFilters() {
    return {
      sport: document.getElementById('filterSport').value,
      category: document.getElementById('filterCategory').value,
      gradeLevel: document.getElementById('filterGrade').value,
      search: document.getElementById('filterSearch').value.trim(),
    };
  }

  function updateFilterBadge() {
    const filters = getFilters();
    let count = 0;
    if (filters.sport && filters.sport !== 'All') count++;
    if (filters.category && filters.category !== 'All') count++;
    if (filters.gradeLevel && filters.gradeLevel !== 'All') count++;

    const badge = document.getElementById('filterActiveBadge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function applyFilters() {
    updateFilterBadge();
    if (currentTab === 'leaderboard') Leaderboard.render();
    if (currentTab === 'cards') Cards.render();
  }

  // ─── Session UI ───
  function updateSessionUI() {
    const session = Storage.getSession();
    const userInfo = document.getElementById('userInfo');
    const headerProfileAvatar = document.getElementById('headerProfileAvatar');
    const headerProfileName = document.getElementById('headerProfileName');
    const adminModeBadge = document.getElementById('adminModeHeaderBadge');
    const logoutBtn = document.getElementById('logoutBtn');

    const headerAdminText = document.getElementById('headerAdminText');

    if (session) {
      const player = Storage.getPlayerById(session.playerId);
      if (player) {
        if (headerProfileName) headerProfileName.textContent = player.username;
        if (headerProfileAvatar) {
          if (player.photo) {
            headerProfileAvatar.innerHTML = `<img src="${player.photo}" alt="${escapeHtml(player.username)}">`;
          } else {
            headerProfileAvatar.innerHTML = `<span class="header-avatar-initial">${player.username ? player.username.charAt(0).toUpperCase() : 'P'}</span>`;
          }
        }
        if (headerAdminText) headerAdminText.textContent = 'Admin';
        if (adminModeBadge) adminModeBadge.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (logoutBtn) {
          logoutBtn.textContent = 'Logout';
          logoutBtn.onclick = () => {
            Auth.logout();
          };
        }
      } else {
        Storage.logout();
        if (headerProfileName) headerProfileName.textContent = 'My Profile';
        if (headerProfileAvatar) headerProfileAvatar.innerHTML = `<span class="header-avatar-initial">P</span>`;
        if (headerAdminText) headerAdminText.textContent = 'Admin';
        if (userInfo) userInfo.style.display = 'none';
      }
    } else if (typeof Admin !== 'undefined' && Admin.isUnlocked && Admin.isUnlocked()) {
      if (headerProfileName) headerProfileName.textContent = 'My Profile';
      if (headerProfileAvatar) headerProfileAvatar.innerHTML = `<span class="header-avatar-initial">P</span>`;
      if (headerAdminText) headerAdminText.textContent = 'Admin (Unlocked)';
      if (adminModeBadge) adminModeBadge.style.display = '';
      if (userInfo) userInfo.style.display = 'flex';
      if (logoutBtn) {
        logoutBtn.textContent = 'Lock';
        logoutBtn.onclick = () => {
          Admin.lock();
        };
      }
    } else {
      if (headerProfileName) headerProfileName.textContent = 'My Profile';
      if (headerProfileAvatar) headerProfileAvatar.innerHTML = `<span class="header-avatar-initial">P</span>`;
      if (headerAdminText) headerAdminText.textContent = 'Admin';
      if (adminModeBadge) adminModeBadge.style.display = 'none';
      if (userInfo) userInfo.style.display = 'none';
    }
  }

  // ─── Modal ───
  function setupModal() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(title, contentHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = contentHTML;
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  // ─── Toast Notifications ───
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `<span class="toast-dot"></span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ─── Public API ───
  return {
    init,
    switchTab,
    getFilters,
    updateSessionUI,
    openModal,
    closeModal,
    showToast,
    populateSportFilter,
    applyFilters,
  };
})();

// ─── Start the app ───
document.addEventListener('DOMContentLoaded', App.init);
