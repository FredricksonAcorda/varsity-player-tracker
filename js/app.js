/**
 * app.js — Main Application Controller (Playbook 2026 Redesign)
 * Handles navigation, unified account dropdown, filter bar, initialization, toasts, and modals.
 */

const App = (() => {
  let currentTab = 'home';

  // ─── Initialize ───
  function init() {
    Storage.init();
    setupNavigation();
    setupAccountDropdown();
    setupFilterBar();
    setupModal();

    // Initialize all modules
    Home.init();
    Auth.init();
    Leaderboard.init();
    Cards.init();
    Profile.init();
    Events.init();
    Admin.init();

    // Show default starting tab
    switchTab('home');
    updateSessionUI();
  }

  // ─── Unified Account / Portal Dropdown ───
  function setupAccountDropdown() {
    const btn = document.getElementById('headerAccountBtn');
    const dropdown = document.getElementById('accountDropdown');
    const wrapper = document.getElementById('headerAccountWrapper');

    if (btn && dropdown) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('show');
        btn.classList.toggle('active', isOpen);
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (wrapper && !wrapper.contains(e.target)) {
          closeAccountDropdown();
        }
      });
    }
  }

  function closeAccountDropdown() {
    const btn = document.getElementById('headerAccountBtn');
    const dropdown = document.getElementById('accountDropdown');
    if (dropdown) dropdown.classList.remove('show');
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }
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

    // Update header account button active highlight if on profile or admin
    const headerAccountBtn = document.getElementById('headerAccountBtn');
    if (headerAccountBtn) {
      headerAccountBtn.classList.toggle('page-active', tab === 'profile' || tab === 'admin');
    }

    updatePillIndicator();

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tab}`);
    });

    // Show/hide filter bar (only for leaderboard and player cards)
    const filterBar = document.getElementById('filterBar');
    const sortItem = document.getElementById('filterSortItem');
    const layoutItem = document.getElementById('filterLayoutItem');

    if (tab === 'leaderboard' || tab === 'cards') {
      if (filterBar) filterBar.classList.remove('hidden');
      if (sortItem) sortItem.style.display = tab === 'cards' ? '' : 'none';
      if (layoutItem) layoutItem.style.display = tab === 'cards' ? '' : 'none';
    } else {
      if (filterBar) filterBar.classList.add('hidden');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh view data
    if (tab === 'home') Home.render();
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
    const searchInput = document.getElementById('filterSearch');
    const toggleBtn = document.getElementById('filterToggleBtn');
    const dropdowns = document.getElementById('filterDropdowns');
    const resetBtn = document.getElementById('resetFilterBtn');

    if (!sportSelect) return;

    // Mobile filter toggle
    if (toggleBtn && dropdowns) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShown = dropdowns.classList.toggle('show');
        toggleBtn.classList.toggle('active', isShown);
        toggleBtn.setAttribute('aria-expanded', isShown ? 'true' : 'false');
      });
    }

    // Reset filters button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        sportSelect.value = 'All';
        updateCategoryFilter();
        if (categorySelect) categorySelect.value = 'All';
        if (gradeSelect) gradeSelect.value = 'All';
        applyFilters();
        showToast('Filters reset to default.', 'info');
      });
    }

    // Populate sports dropdown
    populateSportFilter();

    // Populate grade dropdown
    if (gradeSelect) {
      if (gradeSelect.options.length > 0) gradeSelect.options[0].textContent = 'Grade: All';
      Storage.getGradeLevels().forEach(grade => {
        const opt = document.createElement('option');
        opt.value = grade;
        opt.textContent = `Grade: ${grade}`;
        gradeSelect.appendChild(opt);
      });
    }

    // Event listeners
    sportSelect.addEventListener('change', () => {
      updateCategoryFilter();
      applyFilters();
    });

    if (categorySelect) {
      categorySelect.addEventListener('change', applyFilters);
    }

    if (gradeSelect) {
      gradeSelect.addEventListener('change', applyFilters);
    }

    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFilters, 200);
      });
    }
  }

  function populateSportFilter() {
    const sportSelect = document.getElementById('filterSport');
    if (!sportSelect) return;
    const currentVal = sportSelect.value;

    if (sportSelect.options.length > 0) {
      sportSelect.options[0].textContent = 'Sport: All';
    }

    while (sportSelect.options.length > 1) {
      sportSelect.remove(1);
    }

    const sports = Storage.getSportsConfig();
    sports.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.sport;
      opt.textContent = `Sport: ${s.sport}`;
      sportSelect.appendChild(opt);
    });

    sportSelect.value = currentVal || 'All';
  }

  function updateCategoryFilter() {
    const sportSelect = document.getElementById('filterSport');
    const categorySelect = document.getElementById('filterCategory');
    if (!sportSelect || !categorySelect) return;

    const selectedSport = sportSelect.value;
    if (categorySelect.options.length > 0) {
      categorySelect.options[0].textContent = 'Category: All';
    }

    while (categorySelect.options.length > 1) {
      categorySelect.remove(1);
    }

    if (selectedSport === 'All') {
      categorySelect.disabled = true;
      categorySelect.value = 'All';
    } else {
      categorySelect.disabled = false;
      const categories = Storage.getCategoriesForSport(selectedSport);
      categories.forEach(cat => {
        const opt = document.createElement('option');
        const catName = typeof cat === 'string' ? cat : cat.category;
        opt.value = catName;
        opt.textContent = `Category: ${catName}`;
        categorySelect.appendChild(opt);
      });
      categorySelect.value = 'All';
    }
  }

  function getFilters() {
    const searchInput = document.getElementById('filterSearch');
    const sportSelect = document.getElementById('filterSport');
    const categorySelect = document.getElementById('filterCategory');
    const gradeSelect = document.getElementById('filterGrade');

    return {
      search: searchInput ? searchInput.value.trim() : '',
      sport: sportSelect ? sportSelect.value : 'All',
      category: categorySelect ? categorySelect.value : 'All',
      grade: gradeSelect ? gradeSelect.value : 'All',
    };
  }

  function updateFilterBadge() {
    const filters = getFilters();
    let count = 0;
    const sportSelect = document.getElementById('filterSport');
    const categorySelect = document.getElementById('filterCategory');
    const gradeSelect = document.getElementById('filterGrade');
    const searchInput = document.getElementById('filterSearch');
    const resetBtn = document.getElementById('resetFilterBtn');

    if (filters.search) count++;
    if (filters.sport !== 'All') count++;
    if (filters.category !== 'All') count++;
    if (filters.grade !== 'All') count++;

    if (sportSelect) sportSelect.classList.toggle('has-value', filters.sport !== 'All');
    if (categorySelect) categorySelect.classList.toggle('has-value', filters.category !== 'All');
    if (gradeSelect) gradeSelect.classList.toggle('has-value', filters.grade !== 'All');
    if (searchInput) searchInput.classList.toggle('has-value', Boolean(filters.search));
    if (resetBtn) resetBtn.classList.toggle('active', count > 0);

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

  // ─── Session UI & Account Dropdown Synchronization ───
  function updateSessionUI() {
    const session = Storage.getSession();
    const accountAvatar = document.getElementById('headerAccountAvatar');
    const accountName = document.getElementById('headerAccountName');
    const accountRole = document.getElementById('headerAccountRole');
    const athleteBadge = document.getElementById('dropdownAthleteBadge');
    const athleteLoggedIn = document.getElementById('dropdownAthleteLoggedIn');
    const athleteGuest = document.getElementById('dropdownAthleteGuest');
    const playerName = document.getElementById('dropdownPlayerName');
    const playerId = document.getElementById('dropdownPlayerId');
    const adminBadge = document.getElementById('dropdownAdminBadge');
    const adminUnlockedRow = document.getElementById('dropdownAdminUnlockedRow');
    const adminActionText = document.getElementById('dropdownAdminActionText');

    const isAdminUnlocked = typeof Admin !== 'undefined' && Admin.isUnlocked && Admin.isUnlocked();

    if (session) {
      const player = Storage.getPlayerById(session.playerId);
      if (player) {
        if (accountName) accountName.textContent = player.username;
        if (accountRole) accountRole.textContent = `Athlete (${player.gradeLevel || 'Varsity'})`;
        if (accountAvatar) {
          if (player.photo) {
            accountAvatar.innerHTML = `<img src="${player.photo}" alt="${escapeHtml(player.username)}">`;
          } else {
            accountAvatar.innerHTML = `<span class="header-avatar-initial">${player.username ? player.username.charAt(0).toUpperCase() : 'P'}</span>`;
          }
        }
        if (athleteBadge) {
          athleteBadge.textContent = 'Active Session';
          athleteBadge.className = 'dropdown-badge athlete logged-in';
        }
        if (athleteLoggedIn) athleteLoggedIn.style.display = 'block';
        if (athleteGuest) athleteGuest.style.display = 'none';
        if (playerName) playerName.textContent = player.username;
        if (playerId) playerId.textContent = player.id;
      } else {
        Storage.logout();
      }
    } else {
      if (athleteBadge) {
        athleteBadge.textContent = 'Guest';
        athleteBadge.className = 'dropdown-badge athlete';
      }
      if (athleteLoggedIn) athleteLoggedIn.style.display = 'none';
      if (athleteGuest) athleteGuest.style.display = 'block';
    }

    // Admin Status in Dropdown
    if (isAdminUnlocked) {
      if (!session) {
        if (accountName) accountName.textContent = 'Admin Console';
        if (accountRole) accountRole.textContent = 'Coach / Official';
        if (accountAvatar) accountAvatar.innerHTML = `<span class="header-avatar-initial" style="background:var(--color-win);">⚙</span>`;
      }
      if (adminBadge) {
        adminBadge.textContent = 'Unlocked';
        adminBadge.className = 'dropdown-badge admin unlocked';
      }
      if (adminUnlockedRow) adminUnlockedRow.style.display = 'block';
      if (adminActionText) adminActionText.textContent = 'Open Admin Console (Unlocked)';
    } else {
      if (!session) {
        if (accountName) accountName.textContent = 'Athlete & Coach';
        if (accountRole) accountRole.textContent = 'Portal Access';
        if (accountAvatar) accountAvatar.innerHTML = `<span class="header-avatar-initial">P</span>`;
      }
      if (adminBadge) {
        adminBadge.textContent = 'Protected';
        adminBadge.className = 'dropdown-badge admin';
      }
      if (adminUnlockedRow) adminUnlockedRow.style.display = 'none';
      if (adminActionText) adminActionText.textContent = 'Admin Dashboard & Matches';
    }
  }

  // ─── Modal ───
  function setupModal() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(title, contentHTML) {
    const overlay = document.getElementById('modalOverlay');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = contentHTML;
    if (overlay) overlay.classList.add('active');
  }

  function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  // ─── Toast Notifications ───
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ─── Public API ───
  return {
    init,
    switchTab,
    getFilters,
    applyFilters,
    populateSportFilter,
    openModal,
    closeModal,
    showToast,
    updateSessionUI,
    closeAccountDropdown,
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
