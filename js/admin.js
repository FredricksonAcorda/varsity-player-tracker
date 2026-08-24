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
          restrictedText.innerHTML = `You are currently signed in as Player <strong>${escapeHtml(currentPlayer.username)}</strong> (${currentPlayer.id}). Your are restricted from accessing the admin panel.`;
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
    if (players.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:3rem 1rem;">
            <div class="empty-state-icon-box" style="margin:0 auto 1rem; width:52px; height:52px;">
              <span class="empty-state-icon" style="font-size:1.5rem;">👤</span>
            </div>
            <div style="font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">No Athletes Found</div>
            <p style="color:var(--text-muted); font-size:0.85rem; max-width:360px; margin:0 auto 1.25rem;">No athletes match your active search or filters. Add a new player or clear your filters.</p>
            <button class="btn btn-primary btn-sm" onclick="Admin.showAddPlayerModal()">+ Add Athlete to Roster</button>
          </td>
        </tr>
      `;
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
      const sport = document.getElementById('aapSport').value;

      if (!username || !password || !gradeLevel || !sport) {
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

      const player = Storage.addPlayer({ username, password, gradeLevel, section, sports: [{ sport, categories: selectedCats }] });
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
      const errorEl = document.getElementById('epError');

      if (!username) { errorEl.textContent = 'Username is required.'; return; }

      const existing = Storage.getPlayerByUsername(username);
      if (existing && existing.id !== playerId) {
        errorEl.textContent = 'Username already taken.';
        return;
      }

      Storage.updatePlayer(playerId, { username, gradeLevel, section });
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
    const p1Select = document.getElementById('matchPlayer1');
    const p2Select = document.getElementById('matchPlayer2');
    const winnerSelect = document.getElementById('matchWinner');
    const matchForm = document.getElementById('recordMatchForm');

    if (!sportSelect || !catSelect || !matchForm) return;

    sportSelect.addEventListener('change', () => {
      populateSelectCategories(sportSelect.value, catSelect);
      catSelect.dispatchEvent(new Event('change'));
    });

    function updateWinnerDropdown() {
      if (!winnerSelect) return;
      winnerSelect.innerHTML = '<option value="">Select Winner...</option>';
      const p1Val = p1Select?.value;
      const p2Val = p2Select?.value;

      if (p1Val) {
        const p1 = Storage.getPlayerById(p1Val);
        const opt = document.createElement('option');
        opt.value = p1Val;
        opt.textContent = `Player 1: ${p1 ? p1.username : p1Val}`;
        winnerSelect.appendChild(opt);
      }
      if (p2Val) {
        const p2 = Storage.getPlayerById(p2Val);
        const opt = document.createElement('option');
        opt.value = p2Val;
        opt.textContent = `Player 2: ${p2 ? p2.username : p2Val}`;
        winnerSelect.appendChild(opt);
      }
    }

    catSelect.addEventListener('change', () => {
      const sport = sportSelect.value;
      const category = catSelect.value;
      if (p1Select) p1Select.innerHTML = '<option value="">Select Player 1...</option>';
      if (p2Select) p2Select.innerHTML = '<option value="">Select Player 2 (Optional)...</option>';
      if (winnerSelect) winnerSelect.innerHTML = '<option value="">Select players first...</option>';

      if (!sport || !category) return;

      const players = Storage.getPlayers().filter(p =>
        (p.sports || []).some(s => s.sport === sport && (s.categories || []).some(c => (c.category || c) === category))
      );

      players.forEach(p => {
        if (p1Select) {
          const opt1 = document.createElement('option');
          opt1.value = p.id;
          opt1.textContent = `${p.username} (${p.id})`;
          p1Select.appendChild(opt1);
        }
        if (p2Select) {
          const opt2 = document.createElement('option');
          opt2.value = p.id;
          opt2.textContent = `${p.username} (${p.id})`;
          p2Select.appendChild(opt2);
        }
      });
    });

    if (p1Select) p1Select.addEventListener('change', updateWinnerDropdown);
    if (p2Select) p2Select.addEventListener('change', updateWinnerDropdown);

    matchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const sport = sportSelect.value;
      const category = catSelect.value;
      const player1 = p1Select ? p1Select.value : '';
      const player2 = p2Select ? p2Select.value : '';
      const winner = winnerSelect ? winnerSelect.value : '';
      const eventName = document.getElementById('matchEvent')?.value.trim() || '';

      if (!sport || !category || !player1 || !winner) {
        App.showToast('Please select Sport, Category, Player 1, and Winner.', 'error');
        return;
      }

      const loser = winner === player1 ? player2 : player1;
      const winnerName = Storage.getPlayerById(winner)?.username || winner;
      const loserName = loser ? (Storage.getPlayerById(loser)?.username || loser) : 'Opponent';

      Storage.recordMatch(winner, sport, category, 'W', loserName, eventName);
      if (loser) {
        Storage.recordMatch(loser, sport, category, 'L', winnerName, eventName);
      }

      App.showToast(`Match outcome recorded! Winner: ${winnerName}`, 'success');
      matchForm.reset();
      catSelect.innerHTML = '<option value="">Select sport first...</option>';
      if (p1Select) p1Select.innerHTML = '<option value="">Select category first...</option>';
      if (p2Select) p2Select.innerHTML = '<option value="">Select category first...</option>';
      if (winnerSelect) winnerSelect.innerHTML = '<option value="">Select players first...</option>';

      // Unified synchronization across all views!
      Leaderboard.render();
      Cards.render();
      Profile.render();
      Events.render();
      renderRanksTable();
      renderPlayersTable();
      if (typeof Home !== 'undefined' && Home.render) Home.render();
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
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:2.5rem 1rem;">
            <div class="empty-state-icon-box" style="margin:0 auto 0.75rem; width:48px; height:48px;">
              <span class="empty-state-icon" style="font-size:1.35rem;">🏅</span>
            </div>
            <div style="font-size:0.95rem; font-weight:700; color:var(--text-primary); margin-bottom:0.25rem;">No Athletes in ${escapeHtml(sport)} — ${escapeHtml(category)}</div>
            <p style="color:var(--text-muted); font-size:0.8rem; max-width:320px; margin:0 auto 1rem;">Enroll athletes into this category from the Players tab to configure their official rankings.</p>
            <button class="btn btn-secondary btn-sm" onclick="Admin.showAddPlayerModal()">+ Enroll New Athlete</button>
          </td>
        </tr>
      `;
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
      container.innerHTML = `
        <div class="empty-state" style="margin:1.5rem 0; padding:2.5rem 1.5rem;">
          <div class="empty-state-icon-box" style="width:52px; height:52px; margin-bottom:0.75rem;">
            <span class="empty-state-icon" style="font-size:1.5rem;">📅</span>
          </div>
          <h3 style="font-size:1.1rem;">No Tournaments Created Yet</h3>
          <p style="font-size:0.85rem; margin-bottom:1.25rem;">Create multi-sport events, configure categories, and start recording match outcomes.</p>
          <button class="btn btn-primary btn-sm" onclick="Admin.showAddEventModal()">+ Create First Tournament</button>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(event => {
      const matchCount = event.matches ? event.matches.length : 0;

      const sportsSummary = (event.sports || []).map(s => {
        const catPills = (s.categories || []).map(c => `<span class="event-cat-pill">${escapeHtml(c)}</span>`).join('');
        return `
          <div class="event-sport-row" style="margin-bottom:0.4rem;">
            <strong style="font-size:0.825rem; color:var(--accent-primary); min-width:80px;">${escapeHtml(s.sport)}:</strong>
            <div class="event-cat-pills">${catPills || '<span style="color:var(--text-muted); font-size:0.75rem;">Open</span>'}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="event-card" style="margin-bottom:1rem;">
          <div class="event-card-header">
            <div>
              <div class="event-name">${escapeHtml(event.name)}</div>
              <div class="event-date-meta">Date: ${event.date} • ${matchCount} Matches</div>
            </div>
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

          <div class="event-sports-container" style="margin:0.75rem 0;">
            ${sportsSummary || '<p style="color:var(--text-muted); font-size:0.8rem;">All Sports</p>'}
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

    const sportsHTML = sportsConfig.map((s, idx) => {
      const catCheckboxes = s.categories.map(cat => `
        <label class="checkbox-item" style="font-size:0.75rem; padding:0.25rem 0.5rem;">
          <input type="checkbox" class="ae-cat-cb" data-sport-index="${idx}" data-sport="${escapeAttr(s.sport)}" value="${escapeAttr(cat)}">
          ${escapeHtml(cat)}
        </label>
      `).join('');

      return `
        <div class="ae-sport-card" id="ae-sport-card-${idx}" style="margin-bottom:0.75rem; padding:0.75rem; background:var(--bg-glass); border:1px solid var(--border-glass); border-radius:var(--border-radius-sm);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label class="checkbox-item" style="font-weight:700; font-size:0.875rem;">
              <input type="checkbox" class="ae-sport-master-cb" data-sport-index="${idx}" value="${escapeAttr(s.sport)}">
              ${escapeHtml(s.sport)}
            </label>
            <div class="ae-cat-actions" id="ae-cat-actions-${idx}" style="display:none; gap:0.35rem;">
              <button type="button" class="btn btn-ghost btn-sm" style="font-size:0.7rem; padding:0.15rem 0.4rem;" onclick="Admin.toggleAllEventCats(${idx}, true)">Select All</button>
              <button type="button" class="btn btn-ghost btn-sm" style="font-size:0.7rem; padding:0.15rem 0.4rem;" onclick="Admin.toggleAllEventCats(${idx}, false)">Clear</button>
            </div>
          </div>
          <div class="ae-cats-container" id="ae-cats-container-${idx}" style="display:none; margin-top:0.6rem; padding-left:1.5rem; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:0.4rem;">
            ${catCheckboxes}
          </div>
        </div>
      `;
    }).join('');

    const content = `
      <form id="addEventForm">
        <div class="form-group">
          <label>Event Name *</label>
          <input type="text" id="aeName" placeholder="e.g. Intramurals 2026" required>
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

        <div class="form-group" style="margin-top:0.75rem;">
          <label style="font-weight:700; margin-bottom:0.4rem;">Included Sports & Categories *</label>
          <p style="color:var(--text-muted); font-size:0.75rem; margin-bottom:0.75rem;">Select which sports and specific categories are part of this event/tournament.</p>
          <div class="ae-sports-list" style="max-height:280px; overflow-y:auto; padding-right:0.3rem;">
            ${sportsHTML}
          </div>
        </div>

        <div class="form-error" id="aeError"></div>
        <button type="submit" class="btn btn-primary btn-full" style="margin-top:1rem;">Create Event</button>
      </form>
    `;

    App.openModal('Create Event / Tournament', content);

    // Setup master sport toggle listeners
    document.querySelectorAll('.ae-sport-master-cb').forEach(masterCb => {
      masterCb.addEventListener('change', function () {
        const idx = this.dataset.sportIndex;
        const catsContainer = document.getElementById(`ae-cats-container-${idx}`);
        const actionsContainer = document.getElementById(`ae-cat-actions-${idx}`);

        if (this.checked) {
          catsContainer.style.display = 'grid';
          actionsContainer.style.display = 'flex';
          // Check all categories by default when sport is checked
          document.querySelectorAll(`.ae-cat-cb[data-sport-index="${idx}"]`).forEach(cb => {
            cb.checked = true;
            cb.closest('.checkbox-item')?.classList.add('checked');
          });
        } else {
          catsContainer.style.display = 'none';
          actionsContainer.style.display = 'none';
          document.querySelectorAll(`.ae-cat-cb[data-sport-index="${idx}"]`).forEach(cb => {
            cb.checked = false;
            cb.closest('.checkbox-item')?.classList.remove('checked');
          });
        }
      });
    });

    // Setup individual category checkbox styling
    document.querySelectorAll('.ae-cat-cb').forEach(cb => {
      cb.addEventListener('change', function () {
        this.closest('.checkbox-item')?.classList.toggle('checked', this.checked);
        const idx = this.dataset.sportIndex;
        const masterCb = document.querySelector(`.ae-sport-master-cb[data-sport-index="${idx}"]`);
        const anyChecked = document.querySelectorAll(`.ae-cat-cb[data-sport-index="${idx}"]:checked`).length > 0;
        if (masterCb) {
          masterCb.checked = anyChecked;
        }
      });
    });

    document.getElementById('addEventForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const errorEl = document.getElementById('aeError');
      const name = document.getElementById('aeName').value.trim();
      const date = document.getElementById('aeDate').value;
      const status = document.getElementById('aeStatus').value;

      if (!name || !date) {
        errorEl.textContent = 'Please fill in event name and date.';
        return;
      }

      // Collect selected sports & categories
      const sportsConfig = Storage.getSportsConfig();
      const selectedSports = [];

      sportsConfig.forEach((s, idx) => {
        const checkedCats = [];
        document.querySelectorAll(`.ae-cat-cb[data-sport-index="${idx}"]:checked`).forEach(cb => {
          checkedCats.push(cb.value);
        });

        if (checkedCats.length > 0) {
          selectedSports.push({
            sport: s.sport,
            categories: checkedCats,
          });
        }
      });

      if (selectedSports.length === 0) {
        errorEl.textContent = 'Please select at least one sport and category for this event.';
        return;
      }

      Storage.addEvent({ name, sports: selectedSports, date, status });
      App.closeModal();
      App.showToast(`Tournament "${name}" created with ${selectedSports.length} sports!`, 'success');
      renderAdminEvents();
      Events.render();
      if (typeof Home !== 'undefined' && Home.render) Home.render();
    });
  }

  function toggleAllEventCats(sportIndex, selectAll) {
    document.querySelectorAll(`.ae-cat-cb[data-sport-index="${sportIndex}"]`).forEach(cb => {
      cb.checked = selectAll;
      cb.closest('.checkbox-item')?.classList.toggle('checked', selectAll);
    });
    const masterCb = document.querySelector(`.ae-sport-master-cb[data-sport-index="${sportIndex}"]`);
    if (masterCb) masterCb.checked = selectAll;
  }

  function showAddMatchToEvent(eventId) {
    if (!checkAdminAuth()) return;

    const event = Storage.getEventById(eventId);
    if (!event) return;

    const sportsList = event.sports && event.sports.length > 0 ? event.sports : [];
    if (sportsList.length === 0) {
      App.showToast('This event has no configured sports.', 'error');
      return;
    }

    const sportOptions = sportsList.map(s => `<option value="${escapeAttr(s.sport)}">${escapeHtml(s.sport)}</option>`).join('');

    const content = `
      <form id="eventMatchForm">
        <div class="form-row">
          <div class="form-group">
            <label>Sport *</label>
            <select id="emSport" required>
              <option value="">Select sport...</option>
              ${sportOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Category *</label>
            <select id="emCategory" required>
              <option value="">Select sport first...</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Player 1 *</label>
            <select id="emPlayer1" required><option value="">Select category first...</option></select>
          </div>
          <div class="form-group">
            <label>Player 2</label>
            <select id="emPlayer2"><option value="">Select category first...</option></select>
          </div>
        </div>

        <div class="form-group">
          <label>Winner *</label>
          <select id="emWinner" required><option value="">Select players first...</option></select>
        </div>

        <div class="form-error" id="emError"></div>
        <button type="submit" class="btn btn-primary btn-full">Record Match Result</button>
      </form>
    `;

    App.openModal(`Add Match — ${event.name}`, content);

    const sportSelect = document.getElementById('emSport');
    const catSelect = document.getElementById('emCategory');
    const p1Select = document.getElementById('emPlayer1');
    const p2Select = document.getElementById('emPlayer2');
    const winnerSelect = document.getElementById('emWinner');

    function updateWinnerOptions() {
      const p1Val = p1Select.value;
      const p2Val = p2Select.value;
      winnerSelect.innerHTML = '<option value="">Select Winner...</option>';

      if (p1Val) {
        const p1 = Storage.getPlayerById(p1Val);
        const opt = document.createElement('option');
        opt.value = p1Val;
        opt.textContent = `Player 1: ${p1 ? p1.username : p1Val}`;
        winnerSelect.appendChild(opt);
      }
      if (p2Val) {
        const p2 = Storage.getPlayerById(p2Val);
        const opt = document.createElement('option');
        opt.value = p2Val;
        opt.textContent = `Player 2: ${p2 ? p2.username : p2Val}`;
        winnerSelect.appendChild(opt);
      }
    }

    sportSelect.addEventListener('change', () => {
      const selectedSportName = sportSelect.value;
      catSelect.innerHTML = '<option value="">Select category...</option>';
      p1Select.innerHTML = '<option value="">Select category first...</option>';
      p2Select.innerHTML = '<option value="">Select category first...</option>';
      winnerSelect.innerHTML = '<option value="">Select players first...</option>';

      if (!selectedSportName) return;

      const sportObj = sportsList.find(s => s.sport === selectedSportName);
      if (sportObj && sportObj.categories) {
        sportObj.categories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          catSelect.appendChild(opt);
        });
      }
    });

    catSelect.addEventListener('change', () => {
      const sport = sportSelect.value;
      const category = catSelect.value;

      p1Select.innerHTML = '<option value="">Select Player 1...</option>';
      p2Select.innerHTML = '<option value="">Select Player 2 (Optional)...</option>';
      winnerSelect.innerHTML = '<option value="">Select players first...</option>';

      if (!sport || !category) return;

      const players = Storage.getPlayers().filter(p =>
        (p.sports || []).some(s => s.sport === sport && (s.categories || []).some(c => (c.category || c) === category))
      );

      players.forEach(p => {
        const opt1 = document.createElement('option');
        opt1.value = p.id;
        opt1.textContent = `${p.username} (${p.id})`;
        p1Select.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = p.id;
        opt2.textContent = `${p.username} (${p.id})`;
        p2Select.appendChild(opt2);
      });
    });

    p1Select.addEventListener('change', updateWinnerOptions);
    p2Select.addEventListener('change', updateWinnerOptions);

    document.getElementById('eventMatchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkAdminAuth()) return;

      const sport = sportSelect.value;
      const category = catSelect.value;
      const player1 = p1Select.value;
      const player2 = p2Select.value;
      const winner = winnerSelect.value;
      const errorEl = document.getElementById('emError');

      if (!sport || !category || !player1 || !winner) {
        errorEl.textContent = 'Please select Sport, Category, Player 1, and Winner.';
        return;
      }

      // Record match in event
      Storage.addMatchToEvent(eventId, { sport, category, player1, player2, winner });

      // Update player win/loss records
      const loser = winner === player1 ? player2 : player1;
      Storage.recordMatch(winner, sport, category, 'W',
        Storage.getPlayerById(loser)?.username || '', event.name);
      if (loser) {
        Storage.recordMatch(loser, sport, category, 'L',
          Storage.getPlayerById(winner)?.username || '', event.name);
      }

      App.closeModal();
      App.showToast('Match recorded and athlete statistics updated!', 'success');
      renderAdminEvents();
      Events.render();
      Leaderboard.render();
      Cards.render();
      Profile.render();
      renderRanksTable();
      renderPlayersTable();
      if (typeof Home !== 'undefined' && Home.render) Home.render();
    });
  }

  function updateEventStatus(eventId, status) {
    if (!checkAdminAuth()) return;

    Storage.updateEvent(eventId, { status });
    App.showToast(`Event status updated to ${status}.`, 'info');
    Events.render();
    if (typeof Home !== 'undefined' && Home.render) Home.render();
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
    if (typeof Home !== 'undefined' && Home.render) Home.render();
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
    toggleAllEventCats,
    clearAllData,
  };
})();
