/**
 * admin.js — Admin Panel Module
 * Password-protected admin panel for managing players, recording matches,
 * setting ranks, managing events, sports config, and settings.
 */

const Admin = (() => {
  let isUnlocked = false;

  function init() {
    // Check persisted admin session (only valid if not logged in as a player)
    if (sessionStorage.getItem('varsity_admin_unlocked') === 'true' && !Storage.getCurrentPlayer()) {
      isUnlocked = true;
    } else {
      isUnlocked = false;
      sessionStorage.removeItem('varsity_admin_unlocked');
    }

    setupAdminLogin();
    setupAdminTabs();
    setupRecordMatch();
    setupRanks();
    setupEvents();
    setupSportsConfig();
    setupSettings();
    setupPlayerManagement();
  }

  function render() {
    const restricted = document.getElementById('adminRestricted');
    const gate = document.getElementById('adminGate');
    const panel = document.getElementById('adminPanel');
    if (!gate || !panel) return;

    const currentPlayer = Storage.getCurrentPlayer();

    // 1. If an athlete is logged in, restrict admin access completely
    if (currentPlayer) {
      if (restricted) {
        restricted.style.display = 'block';
        const restrictedText = document.getElementById('adminRestrictedText');
        if (restrictedText) {
          restrictedText.innerHTML = `You are currently signed in as Athlete <strong>${escapeHtml(currentPlayer.username)}</strong> (${currentPlayer.id}). Administrative tools (roster CRUD, match recording, and rank adjustments) are restricted to authorized coaches and organizers.`;
        }
      }
      gate.style.display = 'none';
      panel.style.display = 'none';
      return;
    }

    // 2. If no athlete is logged in, hide restricted banner
    if (restricted) restricted.style.display = 'none';

    // Verify session
    if (sessionStorage.getItem('varsity_admin_unlocked') === 'true') {
      isUnlocked = true;
    }

    // 3. Show admin panel if unlocked, else show login gate
    if (isUnlocked) {
      gate.style.display = 'none';
      panel.style.display = 'block';
      populateAdminFilters();
      renderPlayersTable();
    } else {
      gate.style.display = 'block';
      panel.style.display = 'none';
    }
  }

  // ─── Admin Login / Unlock ───
  function setupAdminLogin() {
    const form = document.getElementById('adminLoginForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        unlock(e);
      });
    }
  }

  function unlock(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Safety check: Cannot unlock admin while logged in as an athlete
    if (Storage.getCurrentPlayer()) {
      App.showToast('Please log out of your athlete account before accessing Admin.', 'error');
      render();
      return;
    }

    const passwordInput = document.getElementById('adminPasswordInput');
    const password = passwordInput ? passwordInput.value : '';
    const errorEl = document.getElementById('adminLoginError');

    if (Storage.verifyAdminPassword(password)) {
      isUnlocked = true;
      sessionStorage.setItem('varsity_admin_unlocked', 'true');

      if (errorEl) errorEl.textContent = '';
      if (passwordInput) passwordInput.value = '';

      App.showToast('Admin panel unlocked.', 'success');
      App.updateSessionUI();
      render();
    } else {
      if (errorEl) errorEl.textContent = 'Incorrect password.';
      App.showToast('Incorrect admin password.', 'error');
    }
  }

  function lock() {
    isUnlocked = false;
    sessionStorage.removeItem('varsity_admin_unlocked');
    App.updateSessionUI();
    render();
    App.showToast('Admin panel locked.', 'info');
  }

  function checkAdminAuth() {
    if (!isUnlocked || Storage.getCurrentPlayer()) {
      App.showToast('Unauthorized: Please unlock Admin Mode first.', 'error');
      render();
      return false;
    }
    return true;
  }

  // ─── Admin Sub-Tabs ───
  function setupAdminTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.adminTab;

        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(`admin-${tab}`);
        if (targetSection) targetSection.classList.add('active');

        // Refresh relevant data
        if (tab === 'players') {
          populateAdminFilters();
          renderPlayersTable();
        }
        if (tab === 'matches') refreshMatchForm();
        if (tab === 'ranks') refreshRanksForm();
        if (tab === 'manage-events') renderAdminEvents();
        if (tab === 'sports') renderSportsConfig();
      });
    });
  }

  // ═══════ PLAYERS MANAGEMENT ═══════
  function setupPlayerManagement() {
    const searchInput = document.getElementById('adminPlayerSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderPlayersTable();
      });
    }
  }

  function populateAdminFilters() {
    const sportSelect = document.getElementById('adminPlayerSportFilter');
    const gradeSelect = document.getElementById('adminPlayerGradeFilter');

    if (sportSelect) {
      const currentSport = sportSelect.value;
      sportSelect.innerHTML = '<option value="All">All Sports</option>';
      Storage.getSportsConfig().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.sport;
        opt.textContent = s.sport;
        sportSelect.appendChild(opt);
      });
      sportSelect.value = currentSport || 'All';
    }

    if (gradeSelect) {
      const currentGrade = gradeSelect.value;
      gradeSelect.innerHTML = '<option value="All">All Grades</option>';
      Storage.getGradeLevels().forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        gradeSelect.appendChild(opt);
      });
      gradeSelect.value = currentGrade || 'All';
    }
  }

  function renderPlayersTable() {
    const searchInput = document.getElementById('adminPlayerSearch');
    const sportSelect = document.getElementById('adminPlayerSportFilter');
    const gradeSelect = document.getElementById('adminPlayerGradeFilter');

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sportFilter = sportSelect ? sportSelect.value : 'All';
    const gradeFilter = gradeSelect ? gradeSelect.value : 'All';

    let players = Storage.getPlayers();

    // Filter by search (name or ID)
    if (search) {
      players = players.filter(p =>
        (p.username || '').toLowerCase().includes(search) ||
        (p.id || '').toLowerCase().includes(search)
      );
    }

    // Filter by sport
    if (sportFilter && sportFilter !== 'All') {
      players = players.filter(p =>
        (p.sports || []).some(s => s.sport === sportFilter)
      );
    }

    // Filter by grade
    if (gradeFilter && gradeFilter !== 'All') {
      players = players.filter(p => p.gradeLevel === gradeFilter);
    }

    const tbody = document.getElementById('adminPlayersBody');
    if (!tbody) return;

    if (players.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2.5rem 1rem;">No players found matching your criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = players.map(p => {
      const sportsList = (p.sports || []).map(s => {
        const catCount = (s.categories || []).length;
        return `<span class="sport-tag">${escapeHtml(s.sport)} (${catCount})</span>`;
      }).join(' ');

      const avatarHTML = p.photo
        ? `<img src="${p.photo}" class="table-avatar-img" alt="${escapeHtml(p.username)}">`
        : `<div class="table-avatar-initial">${p.username ? p.username.charAt(0).toUpperCase() : 'P'}</div>`;

      return `
        <tr>
          <td><span style="font-family:var(--font-heading); color:var(--accent-primary); font-size:0.8rem; font-weight:700;">${p.id}</span></td>
          <td>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              ${avatarHTML}
              <div>
                <strong>${escapeHtml(p.username)}</strong>
              </div>
            </div>
          </td>
          <td>${escapeHtml(p.gradeLevel || '—')}</td>
          <td>${escapeHtml(p.section || '—')}</td>
          <td>${escapeHtml(p.gender || '—')}</td>
          <td>${sportsList || '<span style="color:var(--text-muted); font-size:0.8rem;">None</span>'}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-secondary btn-sm" onclick="Admin.editPlayer('${p.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.confirmDeletePlayer('${p.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function showAddPlayerModal() {
    if (!checkAdminAuth()) return;

    const sportsConfig = Storage.getSportsConfig();
    const gradeOptions = Storage.getGradeLevels().map(g => `<option value="${g}">${g}</option>`).join('');
    const sportOptions = sportsConfig.map(s => `<option value="${s.sport}">${s.sport}</option>`).join('');

    const content = `
      <form id="adminAddPlayerForm">
        <div class="form-row">
          <div class="form-group">
            <label>Username *</label>
            <input type="text" id="aapUsername" placeholder="e.g. JohnDoe" required>
          </div>
          <div class="form-group">
            <label>Password *</label>
            <input type="password" id="aapPassword" placeholder="Default athlete password" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Grade Level *</label>
            <select id="aapGrade" required><option value="">Select Grade...</option>${gradeOptions}</select>
          </div>
          <div class="form-group">
            <label>Section / Team</label>
            <input type="text" id="aapSection" placeholder="e.g. Section 1A">
          </div>
        </div>
        <div class="form-group">
          <label>Gender *</label>
          <select id="aapGender" required>
            <option value="">Select Gender...</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>
        </div>
        <div class="form-group">
          <label>Initial Sport *</label>
          <select id="aapSport" required><option value="">Select Sport...</option>${sportOptions}</select>
        </div>
        <div class="form-group" id="aapCatGroup" style="display:none;">
          <label>Categories *</label>
          <div class="checkbox-group" id="aapCategories"></div>
        </div>
        <div class="form-error" id="aapError"></div>
        <button type="submit" class="btn btn-primary btn-full">Add Athlete to Roster</button>
      </form>
    `;

    App.openModal('Add New Athlete', content);

    // Sport change
    document.getElementById('aapSport').addEventListener('change', function () {
      const sport = this.value;
      const catGroup = document.getElementById('aapCatGroup');
      const catContainer = document.getElementById('aapCategories');

      if (!sport) { catGroup.style.display = 'none'; return; }
      catGroup.style.display = 'block';
      catContainer.innerHTML = '';

      Storage.getCategoriesForSport(sport).forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.innerHTML = `<input type="checkbox" value="${cat}"> ${cat}`;
        label.querySelector('input').addEventListener('change', function () {
          label.classList.toggle('checked', this.checked);
        });
        catContainer.appendChild(label);
      });
    });

    // Submit
    document.getElementById('adminAddPlayerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const errorEl = document.getElementById('aapError');
      const username = document.getElementById('aapUsername').value.trim();
      const password = document.getElementById('aapPassword').value;
      const gradeLevel = document.getElementById('aapGrade').value;
      const section = document.getElementById('aapSection').value.trim();
      const gender = document.getElementById('aapGender').value;
      const sport = document.getElementById('aapSport').value;

      if (!username || !password || !gradeLevel || !gender || !sport) {
        errorEl.textContent = 'Please fill in all required fields.';
        return;
      }

      if (Storage.getPlayerByUsername(username)) {
        errorEl.textContent = 'Username already taken.';
        return;
      }

      const selectedCats = [];
      document.querySelectorAll('#aapCategories input:checked').forEach(cb => selectedCats.push(cb.value));

      if (selectedCats.length === 0) {
        errorEl.textContent = 'Select at least one category.';
        return;
      }

      const player = Storage.addPlayer({ username, password, gradeLevel, section, gender, sports: [{ sport, categories: selectedCats }] });
      App.closeModal();
      App.showToast(`Player ${player.username} (${player.id}) created!`, 'success');
      renderPlayersTable();
      Leaderboard.render();
      Cards.render();
    });
  }

  function editPlayer(playerId) {
    if (!checkAdminAuth()) return;

    const player = Storage.getPlayerById(playerId);
    if (!player) return;

    const gradeOptions = Storage.getGradeLevels().map(g =>
      `<option value="${g}" ${g === player.gradeLevel ? 'selected' : ''}>${g}</option>`
    ).join('');

    const sportsConfig = Storage.getSportsConfig();
    const sportOptions = sportsConfig.map(s => `<option value="${s.sport}">${s.sport}</option>`).join('');

    // List of currently enrolled sports and categories
    const enrolledHTML = (player.sports || []).map(s => {
      const catTags = (s.categories || []).map(c => {
        const catName = c.category || c;
        return `
          <span class="category-tag">
            ${escapeHtml(catName)}
            <span class="remove-cat" onclick="Admin.removePlayerCategory('${player.id}', '${escapeAttr(s.sport)}', '${escapeAttr(catName)}')" title="Remove Category">&times;</span>
          </span>
        `;
      }).join(' ');
      return `<div style="margin-bottom:0.5rem;"><strong style="font-size:0.85rem;">${s.sport}:</strong> ${catTags || '<span style="color:var(--text-muted); font-size:0.75rem;">No categories</span>'}</div>`;
    }).join('') || '<p style="color:var(--text-muted); font-size:0.8rem;">No sports enrolled yet.</p>';

    const avatarHTML = player.photo
      ? `<img src="${player.photo}" class="profile-avatar-img" alt="${escapeHtml(player.username)}">`
      : `<span style="font-size:1.5rem; font-weight:800; color:#fff;">${player.username ? player.username.charAt(0).toUpperCase() : 'P'}</span>`;

    const content = `
      <form id="editPlayerForm">
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.25rem;">
          <div class="card-avatar" style="width:56px; height:56px; overflow:hidden;">
            ${avatarHTML}
          </div>
          <div>
            <div style="font-weight:700; font-size:1.1rem;">${escapeHtml(player.username)}</div>
            <div style="color:var(--accent-primary); font-size:0.8rem; font-family:monospace;">${player.id}</div>
          </div>
        </div>

        <div class="form-group">
          <label>Username *</label>
          <input type="text" id="epUsername" value="${escapeHtml(player.username)}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Grade Level *</label>
            <select id="epGrade" required>${gradeOptions}</select>
          </div>
          <div class="form-group">
            <label>Section / Team</label>
            <input type="text" id="epSection" value="${escapeHtml(player.section || '')}">
          </div>
        </div>
        <div class="form-group">
          <label>Gender *</label>
          <select id="epGender" required>
            <option value="Men" ${player.gender === 'Men' ? 'selected' : ''}>Men</option>
            <option value="Women" ${player.gender === 'Women' ? 'selected' : ''}>Women</option>
          </select>
        </div>

        <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid var(--border-glass);">
          <h4 style="font-size:0.9rem; margin-bottom:0.5rem; color:var(--text-secondary);">Enrolled Sports & Categories</h4>
          <div id="enrolledSportsContainer">${enrolledHTML}</div>
        </div>

        <div style="margin-top:1rem; padding:0.75rem; background:var(--bg-glass); border:1px dashed var(--border-glass); border-radius:var(--border-radius-sm);">
          <h4 style="font-size:0.85rem; margin-bottom:0.5rem;">Enroll into Sport</h4>
          <div class="form-row">
            <div class="form-group" style="margin-bottom:0.5rem;">
              <select id="epNewSport"><option value="">Select sport...</option>${sportOptions}</select>
            </div>
          </div>
          <div class="form-group" id="epNewCatGroup" style="display:none; margin-bottom:0.5rem;">
            <div class="checkbox-group" id="epNewCategories"></div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="epAddSportBtn" style="display:none;">Enroll in Categories</button>
        </div>

        <div class="form-error" id="epError" style="margin-top:0.75rem;"></div>
        <button type="submit" class="btn btn-primary btn-full" style="margin-top:1rem;">Save Changes</button>
      </form>
    `;

    App.openModal(`Edit Athlete — ${player.id}`, content);

    // Setup add sport handler in modal
    const epSportSelect = document.getElementById('epNewSport');
    const epCatGroup = document.getElementById('epNewCatGroup');
    const epCatContainer = document.getElementById('epNewCategories');
    const epAddSportBtn = document.getElementById('epAddSportBtn');

    epSportSelect.addEventListener('change', () => {
      const sport = epSportSelect.value;
      if (!sport) {
        epCatGroup.style.display = 'none';
        epAddSportBtn.style.display = 'none';
        return;
      }
      epCatGroup.style.display = 'block';
      epAddSportBtn.style.display = 'inline-flex';
      epCatContainer.innerHTML = '';

      const playerSport = (player.sports || []).find(s => s.sport === sport);
      const existingCats = playerSport ? (playerSport.categories || []).map(c => c.category || c) : [];

      Storage.getCategoriesForSport(sport).forEach(cat => {
        const isExisting = existingCats.includes(cat);
        const label = document.createElement('label');
        label.className = `checkbox-item ${isExisting ? 'checked' : ''}`;
        label.innerHTML = `<input type="checkbox" value="${cat}" ${isExisting ? 'checked disabled' : ''}> ${cat} ${isExisting ? '(already enrolled)' : ''}`;
        if (!isExisting) {
          const cb = label.querySelector('input');
          cb.addEventListener('change', () => label.classList.toggle('checked', cb.checked));
        }
        epCatContainer.appendChild(label);
      });
    });

    epAddSportBtn.addEventListener('click', () => {
      if (!checkAdminAuth()) return;
      const sport = epSportSelect.value;
      if (!sport) return;
      const selectedCats = [];
      document.querySelectorAll('#epNewCategories input:checked:not(:disabled)').forEach(cb => selectedCats.push(cb.value));
      if (selectedCats.length === 0) {
        App.showToast('Please select at least one new category.', 'error');
        return;
      }
      Storage.addSportToPlayer(player.id, sport, selectedCats);
      App.showToast(`Enrolled in ${sport}!`, 'success');
      editPlayer(player.id); // Re-open modal with updated list
      renderPlayersTable();
      Leaderboard.render();
      Cards.render();
    });

    document.getElementById('editPlayerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const username = document.getElementById('epUsername').value.trim();
      const gradeLevel = document.getElementById('epGrade').value;
      const section = document.getElementById('epSection').value.trim();
      const gender = document.getElementById('epGender').value;
      const errorEl = document.getElementById('epError');

      if (!username) { errorEl.textContent = 'Username is required.'; return; }

      const existing = Storage.getPlayerByUsername(username);
      if (existing && existing.id !== playerId) {
        errorEl.textContent = 'Username already taken.';
        return;
      }

      Storage.updatePlayer(playerId, { username, gradeLevel, section, gender });
      App.closeModal();
      App.showToast('Athlete updated successfully.', 'success');
      renderPlayersTable();
      Leaderboard.render();
      Cards.render();
      App.updateSessionUI();
    });
  }

  function removePlayerCategory(playerId, sport, category) {
    if (!checkAdminAuth()) return;

    if (confirm(`Remove ${sport} - ${category} from this player?`)) {
      Storage.removeCategoryFromPlayer(playerId, sport, category);
      App.showToast('Category removed from athlete roster.', 'info');
      editPlayer(playerId);
      renderPlayersTable();
      Leaderboard.render();
      Cards.render();
    }
  }

  function confirmDeletePlayer(playerId) {
    if (!checkAdminAuth()) return;

    const player = Storage.getPlayerById(playerId);
    if (!player) return;

    const content = `
      <p style="margin-bottom:1rem;">Are you sure you want to delete <strong>${escapeHtml(player.username)}</strong> (${player.id})? This will permanently remove their records.</p>
      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-danger btn-full" onclick="Admin.deletePlayer('${playerId}')">Delete Athlete</button>
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">Cancel</button>
      </div>
    `;

    App.openModal('Confirm Delete Athlete', content);
  }

  function deletePlayer(playerId) {
    if (!checkAdminAuth()) return;

    Storage.deletePlayer(playerId);
    App.closeModal();
    App.showToast('Athlete deleted.', 'info');
    renderPlayersTable();
    Leaderboard.render();
    Cards.render();
    App.updateSessionUI();
  }

  // ═══════ RECORD MATCH ═══════
  function setupRecordMatch() {
    const sportSelect = document.getElementById('matchSport');
    const catSelect = document.getElementById('matchCategory');
    const playerSelect = document.getElementById('matchPlayer');

    sportSelect.addEventListener('change', () => {
      populateSelectCategories(sportSelect.value, catSelect);
      catSelect.dispatchEvent(new Event('change'));
    });

    catSelect.addEventListener('change', () => {
      populatePlayersForSportCategory(sportSelect.value, catSelect.value, playerSelect);
    });

    document.getElementById('recordMatchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const sport = sportSelect.value;
      const category = catSelect.value;
      const playerId = playerSelect.value;
      const result = document.getElementById('matchResult').value;
      const opponent = document.getElementById('matchOpponent').value.trim();
      const eventName = document.getElementById('matchEvent').value.trim();

      if (!sport || !category || !playerId || !result) {
        App.showToast('Please fill in all required fields.', 'error');
        return;
      }

      const success = Storage.recordMatch(playerId, sport, category, result, opponent, eventName);
      if (success) {
        const player = Storage.getPlayerById(playerId);
        App.showToast(`Recorded ${result === 'W' ? 'WIN' : 'LOSS'} for ${player.username}!`, 'success');
        e.target.reset();
        Leaderboard.render();
        Cards.render();
      } else {
        App.showToast('Failed to record match. Check player sport/category.', 'error');
      }
    });
  }

  function refreshMatchForm() {
    const sportSelect = document.getElementById('matchSport');
    populateSportSelect(sportSelect);
  }

  function populateSportSelect(selectEl) {
    if (!selectEl) return;
    const current = selectEl.value;
    while (selectEl.options.length > 1) selectEl.remove(1);
    Storage.getSportsConfig().forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.sport;
      opt.textContent = s.sport;
      selectEl.appendChild(opt);
    });
    selectEl.value = current || '';
  }

  function populateSelectCategories(sport, selectEl) {
    if (!selectEl) return;
    while (selectEl.options.length > 1) selectEl.remove(1);
    if (!sport) return;

    Storage.getCategoriesForSport(sport).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      selectEl.appendChild(opt);
    });
  }

  function populatePlayersForSportCategory(sport, category, selectEl) {
    if (!selectEl) return;
    while (selectEl.options.length > 1) selectEl.remove(1);
    if (!sport || !category) return;

    const players = Storage.getPlayers();
    players.forEach(p => {
      const hasSportCat = (p.sports || []).some(s =>
        s.sport === sport && (s.categories || []).some(c => (c.category || c) === category)
      );
      if (hasSportCat) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.username} (${p.id})`;
        selectEl.appendChild(opt);
      }
    });
  }

  // ═══════ RANKS ═══════
  function setupRanks() {
    const sportSelect = document.getElementById('rankSport');
    const catSelect = document.getElementById('rankCategory');

    sportSelect.addEventListener('change', () => {
      populateSelectCategories(sportSelect.value, catSelect);
      catSelect.dispatchEvent(new Event('change'));
    });

    catSelect.addEventListener('change', renderRanksTable);
  }

  function refreshRanksForm() {
    const sportSelect = document.getElementById('rankSport');
    populateSportSelect(sportSelect);
  }

  function renderRanksTable() {
    const sport = document.getElementById('rankSport').value;
    const category = document.getElementById('rankCategory').value;
    const tbody = document.getElementById('ranksBody');

    if (!sport || !category) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">Select a sport and category.</td></tr>`;
      return;
    }

    const players = Storage.getPlayers();
    const eligible = [];

    players.forEach(p => {
      const sportData = (p.sports || []).find(s => s.sport === sport);
      if (!sportData) return;
      const catData = (sportData.categories || []).find(c => (c.category || c) === category);
      if (!catData) return;

      eligible.push({
        id: p.id,
        username: p.username,
        wins: catData.wins || 0,
        losses: catData.losses || 0,
        winrate: Storage.getWinrate(catData.wins || 0, catData.losses || 0),
        rank: catData.rank || 0,
      });
    });

    // Sort by current rank
    eligible.sort((a, b) => {
      if (a.rank === 0 && b.rank === 0) return b.winrate - a.winrate;
      if (a.rank === 0) return 1;
      if (b.rank === 0) return -1;
      return a.rank - b.rank;
    });

    if (eligible.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">No players in this category.</td></tr>`;
      return;
    }

    tbody.innerHTML = eligible.map(p => `
      <tr>
        <td><strong>${escapeHtml(p.username)}</strong> <span style="color:var(--text-muted); font-size:0.75rem;">${p.id}</span></td>
        <td><span class="win-text">${p.wins}</span></td>
        <td><span class="loss-text">${p.losses}</span></td>
        <td>${p.winrate}%</td>
        <td>${p.rank > 0 ? '#' + p.rank : '—'}</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <input type="number" min="0" max="999" value="${p.rank}" 
                   style="width:60px; padding:0.3rem 0.5rem; background:var(--bg-glass); border:1px solid var(--border-glass); border-radius:4px; color:var(--text-primary); font-size:0.8rem;"
                   id="rank-input-${p.id}">
            <button class="btn btn-primary btn-sm" onclick="Admin.saveRank('${p.id}')">Set</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function saveRank(playerId) {
    if (!checkAdminAuth()) return;

    const sport = document.getElementById('rankSport').value;
    const category = document.getElementById('rankCategory').value;
    const input = document.getElementById(`rank-input-${playerId}`);
    const rank = parseInt(input.value) || 0;

    if (Storage.setPlayerRank(playerId, sport, category, rank)) {
      App.showToast(`Rank updated to #${rank}!`, 'success');
      renderRanksTable();
      Leaderboard.render();
      Cards.render();
    } else {
      App.showToast('Failed to update rank.', 'error');
    }
  }

  // ═══════ EVENTS MANAGEMENT ═══════
  function setupEvents() {
    document.getElementById('adminAddEventBtn').addEventListener('click', showAddEventModal);
  }

  function renderAdminEvents() {
    const events = Storage.getEvents();
    const container = document.getElementById('adminEventsList');

    if (events.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);">No events created yet.</p>';
      return;
    }

    container.innerHTML = events.map(event => {
      return `
        <div class="event-card" style="margin-bottom:1rem;">
          <div class="event-card-header">
            <div class="event-name">${escapeHtml(event.name)}</div>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <select onchange="Admin.updateEventStatus('${event.id}', this.value)" 
                      style="padding:0.2rem 0.5rem; background:var(--bg-glass); border:1px solid var(--border-glass); border-radius:4px; color:var(--text-primary); font-size:0.75rem;">
                <option value="upcoming" ${event.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                <option value="ongoing" ${event.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                <option value="completed" ${event.status === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
              <button class="btn btn-danger btn-sm" onclick="Admin.confirmDeleteEvent('${event.id}')">Delete</button>
            </div>
          </div>
          <div class="event-meta">
            <span>${escapeHtml(event.sport)}</span>
            <span>Category: ${escapeHtml(event.category)}</span>
            <span>Date: ${event.date}</span>
            <span>${event.matches ? event.matches.length : 0} Matches</span>
          </div>
          <div style="margin-top:0.75rem;">
            <button class="btn btn-secondary btn-sm" onclick="Admin.showAddMatchToEvent('${event.id}')">+ Add Match Result</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function showAddEventModal() {
    if (!checkAdminAuth()) return;

    const sportsConfig = Storage.getSportsConfig();
    const sportOptions = sportsConfig.map(s => `<option value="${s.sport}">${s.sport}</option>`).join('');

    const content = `
      <form id="addEventForm">
        <div class="form-group">
          <label>Event Name *</label>
          <input type="text" id="aeName" placeholder="e.g. Intramurals 2026 - Badminton" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Sport *</label>
            <select id="aeSport" required><option value="">Select...</option>${sportOptions}</select>
          </div>
          <div class="form-group">
            <label>Category *</label>
            <select id="aeCategory" required><option value="">Select sport first...</option></select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date *</label>
            <input type="date" id="aeDate" required>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="aeStatus">
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Create Event</button>
      </form>
    `;

    App.openModal('Create Event', content);

    document.getElementById('aeSport').addEventListener('change', function () {
      populateSelectCategories(this.value, document.getElementById('aeCategory'));
    });

    document.getElementById('addEventForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const name = document.getElementById('aeName').value.trim();
      const sport = document.getElementById('aeSport').value;
      const category = document.getElementById('aeCategory').value;
      const date = document.getElementById('aeDate').value;
      const status = document.getElementById('aeStatus').value;

      if (!name || !sport || !category || !date) {
        App.showToast('Please fill in all fields.', 'error');
        return;
      }

      Storage.addEvent({ name, sport, category, date, status });
      App.closeModal();
      App.showToast('Event created.', 'success');
      renderAdminEvents();
      Events.render();
    });
  }

  function showAddMatchToEvent(eventId) {
    if (!checkAdminAuth()) return;

    const event = Storage.getEventById(eventId);
    if (!event) return;

    // Get players in this sport + category
    const players = Storage.getPlayers().filter(p =>
      (p.sports || []).some(s => s.sport === event.sport && (s.categories || []).some(c => (c.category || c) === event.category))
    );

    const playerOptions = players.map(p => `<option value="${p.id}">${p.username} (${p.id})</option>`).join('');

    const content = `
      <form id="eventMatchForm">
        <p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:1rem;">${event.sport} — ${event.category}</p>
        <div class="form-row">
          <div class="form-group">
            <label>Player 1 *</label>
            <select id="emPlayer1" required><option value="">Select...</option>${playerOptions}</select>
          </div>
          <div class="form-group">
            <label>Player 2</label>
            <select id="emPlayer2"><option value="">Select...</option>${playerOptions}</select>
          </div>
        </div>
        <div class="form-group">
          <label>Winner *</label>
          <select id="emWinner" required><option value="">Select...</option>${playerOptions}</select>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Record Match</button>
      </form>
    `;

    App.openModal(`Add Match — ${event.name}`, content);

    document.getElementById('eventMatchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const player1 = document.getElementById('emPlayer1').value;
      const player2 = document.getElementById('emPlayer2').value;
      const winner = document.getElementById('emWinner').value;

      if (!player1 || !winner) {
        App.showToast('Please select Player 1 and Winner.', 'error');
        return;
      }

      // Record the match in the event
      Storage.addMatchToEvent(eventId, { player1, player2, winner });

      // Update player stats
      const loser = winner === player1 ? player2 : player1;
      Storage.recordMatch(winner, event.sport, event.category, 'W',
        Storage.getPlayerById(loser)?.username || '', event.name);
      if (loser) {
        Storage.recordMatch(loser, event.sport, event.category, 'L',
          Storage.getPlayerById(winner)?.username || '', event.name);
      }

      App.closeModal();
      App.showToast('Match recorded and player stats updated.', 'success');
      renderAdminEvents();
      Events.render();
      Leaderboard.render();
      Cards.render();
    });
  }

  function updateEventStatus(eventId, status) {
    if (!checkAdminAuth()) return;

    Storage.updateEvent(eventId, { status });
    App.showToast(`Event status updated to ${status}.`, 'info');
    Events.render();
  }

  function confirmDeleteEvent(eventId) {
    if (!checkAdminAuth()) return;

    const event = Storage.getEventById(eventId);
    if (!event) return;

    const content = `
      <p style="margin-bottom:1rem;">Delete event <strong>${escapeHtml(event.name)}</strong>? This will not remove athlete match records.</p>
      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-danger btn-full" onclick="Admin.deleteEvent('${eventId}')">Delete</button>
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">Cancel</button>
      </div>
    `;
    App.openModal('Confirm Delete Event', content);
  }

  function deleteEvent(eventId) {
    if (!checkAdminAuth()) return;

    Storage.deleteEvent(eventId);
    App.closeModal();
    App.showToast('Event deleted.', 'info');
    renderAdminEvents();
    Events.render();
  }

  // ═══════ SPORTS CONFIG ═══════
  function setupSportsConfig() {
    document.getElementById('addSportBtn').addEventListener('click', showAddSportModal);
  }

  function renderSportsConfig() {
    const config = Storage.getSportsConfig();
    const container = document.getElementById('sportsConfigList');

    container.innerHTML = config.map((s, idx) => `
      <div class="sport-config-card">
        <div class="sport-config-header">
          <span class="sport-config-name">${escapeHtml(s.sport)}</span>
          <div class="action-btns">
            <button class="btn btn-secondary btn-sm" onclick="Admin.showAddCategoryModal(${idx})">+ Category</button>
            <button class="btn btn-danger btn-sm" onclick="Admin.confirmDeleteSport(${idx})">Delete</button>
          </div>
        </div>
        <div class="sport-config-categories">
          ${s.categories.map(cat => `
            <span class="category-tag">
              ${escapeHtml(cat)}
              <span class="remove-cat" onclick="Admin.removeCategory(${idx}, '${escapeAttr(cat)}')" title="Remove">&times;</span>
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function showAddSportModal() {
    if (!checkAdminAuth()) return;

    const content = `
      <form id="addNewSportForm">
        <div class="form-group">
          <label>Sport Name *</label>
          <input type="text" id="newSportName" placeholder="e.g. Swimming" required>
        </div>
        <div class="form-group">
          <label>Categories (comma-separated) *</label>
          <input type="text" id="newSportCats" placeholder="e.g. Men's, Women's, Mixed" required>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Add Sport</button>
      </form>
    `;

    App.openModal('Add New Sport', content);

    document.getElementById('addNewSportForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const name = document.getElementById('newSportName').value.trim();
      const catsStr = document.getElementById('newSportCats').value.trim();

      if (!name || !catsStr) {
        App.showToast('Please fill in all fields.', 'error');
        return;
      }

      const categories = catsStr.split(',').map(c => c.trim()).filter(c => c);
      const config = Storage.getSportsConfig();
      config.push({ sport: name, emoji: '', categories });
      Storage.updateSportsConfig(config);

      App.closeModal();
      App.showToast(`Sport "${name}" added.`, 'success');
      renderSportsConfig();

      // Refresh all sport dropdowns
      App.populateSportFilter();
      populateAdminFilters();
      Auth.refreshSportDropdown();
    });
  }

  function showAddCategoryModal(sportIndex) {
    if (!checkAdminAuth()) return;

    const config = Storage.getSportsConfig();
    const sport = config[sportIndex];

    const content = `
      <form id="addCatForm">
        <div class="form-group">
          <label>New Category for ${escapeHtml(sport.sport)}</label>
          <input type="text" id="newCatName" placeholder="e.g. Mixed Doubles" required>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Add Category</button>
      </form>
    `;

    App.openModal('Add Category', content);

    document.getElementById('addCatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const catName = document.getElementById('newCatName').value.trim();
      if (!catName) return;

      const config = Storage.getSportsConfig();
      if (config[sportIndex].categories.includes(catName)) {
        App.showToast('Category already exists.', 'error');
        return;
      }

      config[sportIndex].categories.push(catName);
      Storage.updateSportsConfig(config);
      App.closeModal();
      App.showToast(`Category "${catName}" added.`, 'success');
      renderSportsConfig();
    });
  }

  function removeCategory(sportIndex, category) {
    if (!checkAdminAuth()) return;

    const config = Storage.getSportsConfig();
    config[sportIndex].categories = config[sportIndex].categories.filter(c => c !== category);
    Storage.updateSportsConfig(config);
    App.showToast('Category removed.', 'info');
    renderSportsConfig();
  }

  function confirmDeleteSport(sportIndex) {
    if (!checkAdminAuth()) return;

    const config = Storage.getSportsConfig();
    const sport = config[sportIndex];

    const content = `
      <p style="margin-bottom:1rem;">Delete sport <strong>${escapeHtml(sport.sport)}</strong> and all its categories?</p>
      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-danger btn-full" onclick="Admin.deleteSport(${sportIndex})">Delete</button>
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">Cancel</button>
      </div>
    `;
    App.openModal('Confirm Delete Sport', content);
  }

  function deleteSport(sportIndex) {
    if (!checkAdminAuth()) return;

    const config = Storage.getSportsConfig();
    config.splice(sportIndex, 1);
    Storage.updateSportsConfig(config);
    App.closeModal();
    App.showToast('Sport deleted.', 'info');
    renderSportsConfig();
    App.populateSportFilter();
    populateAdminFilters();
    Auth.refreshSportDropdown();
  }

  // ═══════ SETTINGS ═══════
  function setupSettings() {
    // Change password
    document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const newPw = document.getElementById('newAdminPassword').value;
      const confirmPw = document.getElementById('confirmAdminPassword').value;

      if (newPw !== confirmPw) {
        App.showToast('Passwords do not match.', 'error');
        return;
      }
      if (newPw.length < 4) {
        App.showToast('Password must be at least 4 characters.', 'error');
        return;
      }

      Storage.changeAdminPassword(newPw);
      App.showToast('Admin password changed.', 'success');
      e.target.reset();
    });

    // Export
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      if (!checkAdminAuth()) return;

      const data = Storage.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `varsity_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      App.showToast('Data exported.', 'success');
    });

    // Import
    document.getElementById('importDataBtn').addEventListener('click', () => {
      if (!checkAdminAuth()) return;
      document.getElementById('importDataInput').click();
    });

    document.getElementById('importDataInput').addEventListener('change', (e) => {
      if (!checkAdminAuth()) return;

      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          Storage.importData(data);
          App.showToast('Data imported successfully.', 'success');
          App.populateSportFilter();
          populateAdminFilters();
          Auth.refreshSportDropdown();
          // Refresh current view
          renderPlayersTable();
        } catch (err) {
          App.showToast('Failed to import — invalid JSON file.', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    // Clear all data
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      if (!checkAdminAuth()) return;

      const content = `
        <p style="margin-bottom:1rem; color:var(--color-loss);">This will permanently delete all players, events, and reset all settings to default. This cannot be undone.</p>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-danger btn-full" onclick="Admin.clearAllData()">Delete Everything</button>
          <button class="btn btn-secondary btn-full" onclick="App.closeModal()">Cancel</button>
        </div>
      `;
      App.openModal('Clear All Data', content);
    });
  }

  function clearAllData() {
    if (!checkAdminAuth()) return;

    localStorage.clear();
    Storage.init();
    App.closeModal();
    App.showToast('All data cleared.', 'info');
    App.populateSportFilter();
    populateAdminFilters();
    Auth.refreshSportDropdown();
    App.updateSessionUI();
    renderPlayersTable();
  }

  // ─── Helpers ───
  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (str === undefined || str === null) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  function isUnlockedState() {
    return isUnlocked && !Storage.getCurrentPlayer();
  }

  // ─── Public API ───
  return {
    init,
    render,
    unlock,
    lock,
    isUnlocked: isUnlockedState,
    populateAdminFilters,
    showAddPlayerModal,
    renderPlayersTable,
    editPlayer,
    removePlayerCategory,
    confirmDeletePlayer,
    deletePlayer,
    saveRank,
    updateEventStatus,
    confirmDeleteEvent,
    deleteEvent,
    showAddCategoryModal,
    removeCategory,
    confirmDeleteSport,
    deleteSport,
    showAddMatchToEvent,
    clearAllData,
  };
})();
