/**
 * profile.js — My Profile Module
 * Shows the logged-in player's profile card, stats per sport/category, and match history.
 */

const Profile = (() => {
  let selectedSport = null;
  let selectedCategory = null;

  function init() {
    // Renders on tab switch
  }

  function render() {
    const player = Storage.getCurrentPlayer();
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');

    if (!player) {
      authSection.style.display = '';
      profileSection.style.display = 'none';
      return;
    }

    authSection.style.display = 'none';
    profileSection.style.display = '';

    renderProfileCard(player);
    renderSportTabs(player);

    // Auto-select first sport/category if not set
    if (!selectedSport && player.sports.length > 0) {
      selectedSport = player.sports[0].sport;
      if (player.sports[0].categories.length > 0) {
        selectedCategory = player.sports[0].categories[0].category;
      }
    }

    renderStats(player);
    renderMatchHistory(player);
  }

  function renderProfileCard(player) {
    const card = document.getElementById('profileCard');
    const initial = player.username.charAt(0).toUpperCase();

    // Collect all sports tags
    const sportTags = player.sports.map(s => {
      const emoji = Storage.getSportEmoji(s.sport);
      return s.categories.map(c => 
        `<span class="card-meta-tag">${emoji} ${escapeHtml(c.category)}</span>`
      ).join('');
    }).join('');

    card.innerHTML = `
      <div class="profile-avatar-large">${initial}</div>
      <div class="profile-name">${escapeHtml(player.username)}</div>
      <div class="profile-id">${player.id}</div>
      <div class="profile-meta-row">
        <span class="card-meta-tag">${escapeHtml(player.gradeLevel)}</span>
        <span class="card-meta-tag">${player.gender}</span>
        ${player.section ? `<span class="card-meta-tag">${escapeHtml(player.section)}</span>` : ''}
      </div>
      <div class="profile-meta-row">
        ${sportTags}
      </div>
      <div style="margin-top:1rem;">
        <button class="btn btn-secondary btn-sm" onclick="Profile.showAddSportModal()">+ Add Sport</button>
      </div>
    `;
  }

  function renderSportTabs(player) {
    const tabsContainer = document.getElementById('profileSportTabs');
    const tabs = [];

    player.sports.forEach(s => {
      const emoji = Storage.getSportEmoji(s.sport);
      s.categories.forEach(c => {
        tabs.push({
          sport: s.sport,
          category: c.category,
          emoji,
          label: `${emoji} ${s.sport} — ${c.category}`,
        });
      });
    });

    tabsContainer.innerHTML = tabs.map(t => {
      const isActive = t.sport === selectedSport && t.category === selectedCategory;
      return `
        <button class="profile-sport-tab ${isActive ? 'active' : ''}" 
                onclick="Profile.selectCategory('${escapeAttr(t.sport)}', '${escapeAttr(t.category)}')">
          ${t.label}
        </button>
      `;
    }).join('');
  }

  function selectCategory(sport, category) {
    selectedSport = sport;
    selectedCategory = category;
    const player = Storage.getCurrentPlayer();
    if (player) {
      renderSportTabs(player);
      renderStats(player);
      renderMatchHistory(player);
    }
  }

  function renderStats(player) {
    const container = document.getElementById('profileStats');

    if (!selectedSport || !selectedCategory) {
      container.innerHTML = '<p style="color:var(--text-muted)">Select a sport and category to view stats.</p>';
      return;
    }

    const sportData = player.sports.find(s => s.sport === selectedSport);
    if (!sportData) {
      container.innerHTML = '';
      return;
    }

    const catData = sportData.categories.find(c => c.category === selectedCategory);
    if (!catData) {
      container.innerHTML = '';
      return;
    }

    const wr = Storage.getWinrate(catData.wins, catData.losses);
    const total = catData.wins + catData.losses;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-value win-text count-up">${catData.wins}</div>
        <div class="stat-card-label">Wins</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value loss-text count-up">${catData.losses}</div>
        <div class="stat-card-label">Losses</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value count-up">${wr}%</div>
        <div class="stat-card-label">Winrate</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value count-up" style="color: var(--accent-primary)">${total}</div>
        <div class="stat-card-label">Total Matches</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value count-up">${catData.rank > 0 ? '#' + catData.rank : '—'}</div>
        <div class="stat-card-label">Rank</div>
      </div>
    `;
  }

  function renderMatchHistory(player) {
    const container = document.getElementById('matchHistoryList');

    if (!selectedSport || !selectedCategory) {
      container.innerHTML = '';
      return;
    }

    const sportData = player.sports.find(s => s.sport === selectedSport);
    if (!sportData) { container.innerHTML = ''; return; }

    const catData = sportData.categories.find(c => c.category === selectedCategory);
    if (!catData || !catData.matchHistory || catData.matchHistory.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No match history yet.</p>';
      return;
    }

    container.innerHTML = catData.matchHistory.slice().reverse().map(m => `
      <div class="match-history-item">
        <span class="match-result-badge ${m.result === 'W' ? 'win' : 'loss'}">
          ${m.result === 'W' ? 'WIN' : 'LOSS'}
        </span>
        <span class="match-opponent">${m.opponent ? 'vs ' + escapeHtml(m.opponent) : ''}</span>
        ${m.event ? `<span class="match-event-name">${escapeHtml(m.event)}</span>` : ''}
        <span class="match-date">${m.date}</span>
      </div>
    `).join('');
  }

  // ─── Add Sport Modal ───
  function showAddSportModal() {
    const player = Storage.getCurrentPlayer();
    if (!player) return;

    const sportsConfig = Storage.getSportsConfig();
    const sportOptions = sportsConfig.map(s => 
      `<option value="${s.sport}">${s.emoji} ${s.sport}</option>`
    ).join('');

    const content = `
      <form id="addSportForm">
        <div class="form-group">
          <label for="addSportSelect">Sport</label>
          <select id="addSportSelect" required>
            <option value="">Select sport...</option>
            ${sportOptions}
          </select>
        </div>
        <div class="form-group" id="addSportCategoriesGroup" style="display:none;">
          <label>Categories</label>
          <div class="checkbox-group" id="addSportCategories"></div>
        </div>
        <div class="form-error" id="addSportError"></div>
        <button type="submit" class="btn btn-primary btn-full">Add Sport</button>
      </form>
    `;

    App.openModal('Add Sport / Category', content);

    // Setup sport change handler
    const select = document.getElementById('addSportSelect');
    select.addEventListener('change', () => {
      const sport = select.value;
      const catGroup = document.getElementById('addSportCategoriesGroup');
      const catContainer = document.getElementById('addSportCategories');

      if (!sport) {
        catGroup.style.display = 'none';
        return;
      }

      catGroup.style.display = 'block';
      catContainer.innerHTML = '';

      const categories = Storage.getCategoriesForSport(sport);

      // Find already registered categories
      const playerSport = player.sports.find(s => s.sport === sport);
      const existingCats = playerSport ? playerSport.categories.map(c => c.category) : [];

      categories.forEach(cat => {
        const isExisting = existingCats.includes(cat);
        const label = document.createElement('label');
        label.className = `checkbox-item ${isExisting ? 'checked' : ''}`;
        label.innerHTML = `<input type="checkbox" value="${cat}" ${isExisting ? 'checked disabled' : ''}> ${cat} ${isExisting ? '(joined)' : ''}`;

        if (!isExisting) {
          const cb = label.querySelector('input');
          cb.addEventListener('change', () => label.classList.toggle('checked', cb.checked));
        }

        catContainer.appendChild(label);
      });
    });

    // Form submit
    document.getElementById('addSportForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const sport = document.getElementById('addSportSelect').value;
      const errorEl = document.getElementById('addSportError');

      if (!sport) {
        errorEl.textContent = 'Please select a sport.';
        return;
      }

      const newCats = [];
      document.querySelectorAll('#addSportCategories input:checked:not(:disabled)').forEach(cb => {
        newCats.push(cb.value);
      });

      if (newCats.length === 0) {
        errorEl.textContent = 'Please select at least one new category.';
        return;
      }

      Storage.addSportToPlayer(player.id, sport, newCats);
      App.closeModal();
      App.showToast(`Added ${sport} categories!`, 'success');
      render();
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  return {
    init,
    render,
    selectCategory,
    showAddSportModal,
  };
})();
