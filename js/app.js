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
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });
  }

  function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tab}`);
    });

    // Show/hide filter bar (only for leaderboard and cards)
    const filterBar = document.getElementById('filterBar');
    const mainContent = document.querySelector('.main-content');
    if (tab === 'leaderboard' || tab === 'cards') {
      filterBar.classList.remove('hidden');
      mainContent.classList.remove('no-filter');
    } else {
      filterBar.classList.add('hidden');
      mainContent.classList.add('no-filter');
    }

    // Refresh the view data
    if (tab === 'leaderboard') Leaderboard.render();
    if (tab === 'cards') Cards.render();
    if (tab === 'profile') Profile.render();
    if (tab === 'events') Events.render();
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
        
        const toggleText = toggleBtn.querySelector('span:not(.toggle-icon):not(.filter-badge)');
        const toggleIcon = toggleBtn.querySelector('.toggle-icon');
        if (isShown) {
          if (toggleIcon) toggleIcon.textContent = '✕';
          if (toggleText) toggleText.textContent = 'Close';
        } else {
          if (toggleIcon) toggleIcon.textContent = '⚙️';
          if (toggleText) toggleText.textContent = 'Filters';
        }
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
        document.getElementById('filterGender').value = 'All';
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
    document.getElementById('filterGender').addEventListener('change', applyFilters);

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
      opt.textContent = `${s.emoji} ${s.sport}`;
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
      gender: document.getElementById('filterGender').value,
      search: document.getElementById('filterSearch').value.trim(),
    };
  }

  function updateFilterBadge() {
    const filters = getFilters();
    let count = 0;
    if (filters.sport && filters.sport !== 'All') count++;
    if (filters.category && filters.category !== 'All') count++;
    if (filters.gradeLevel && filters.gradeLevel !== 'All') count++;
    if (filters.gender && filters.gender !== 'All') count++;

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
    const headerUsername = document.getElementById('headerUsername');
    const logoutBtn = document.getElementById('logoutBtn');

    if (session) {
      const player = Storage.getPlayerById(session.playerId);
      if (player) {
        userInfo.style.display = 'flex';
        headerUsername.textContent = player.username;
        logoutBtn.onclick = () => {
          Auth.logout();
        };
      } else {
        Storage.logout();
        userInfo.style.display = 'none';
      }
    } else {
      userInfo.style.display = 'none';
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

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

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
