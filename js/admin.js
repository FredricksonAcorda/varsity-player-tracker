/**
 * admin.js — Admin Panel Module
 * Password-protected admin panel for managing players, recording matches,
 * setting ranks, managing events, sports config, and settings.
 */

const Admin = (() => {
  let isUnlocked = false;

  function init() {
    setupAdminLogin();
    setupAdminTabs();
    setupRecordMatch();
    setupRanks();
    setupEvents();
    setupSportsConfig();
    setupSettings();
    setupPlayerManagement();
  }

  // ─── Admin Login Gate ───
  function setupAdminLogin() {
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const password = document.getElementById('adminPasswordInput').value;
      const errorEl = document.getElementById('adminLoginError');

      if (Storage.verifyAdminPassword(password)) {
        isUnlocked = true;
        document.getElementById('adminGate').style.display = 'none';
        document.getElementById('adminPanel').style.display = '';
        errorEl.textContent = '';
        document.getElementById('adminPasswordInput').value = '';
        App.showToast('Admin panel unlocked!', 'success');
        renderPlayersTable();
      } else {
        errorEl.textContent = 'Incorrect password.';
      }
    });

    document.getElementById('adminLockBtn').addEventListener('click', () => {
      isUnlocked = false;
      document.getElementById('adminGate').style.display = '';
      document.getElementById('adminPanel').style.display = 'none';
      App.showToast('Admin panel locked.', 'info');
    });
  }

  // ─── Admin Sub-Tabs ───
  function setupAdminTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.adminTab;

        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`admin-${tab}`).classList.add('active');

        // Refresh relevant data
        if (tab === 'players') renderPlayersTable();
        if (tab === 'matches') refreshMatchForm();
        if (tab === 'ranks') refreshRanksForm();
        if (tab === 'manage-events') renderAdminEvents();
        if (tab === 'sports') renderSportsConfig();
      });
    });
  }

  // ═══════ PLAYERS MANAGEMENT ═══════
  function setupPlayerManagement() {
    document.getElementById('adminPlayerSearch').addEventListener('input', () => {
      renderPlayersTable();
    });

    document.getElementById('adminAddPlayerBtn').addEventListener('click', showAddPlayerModal);
  }

  function renderPlayersTable() {
    const search = document.getElementById('adminPlayerSearch').value.toLowerCase().trim();
    let players = Storage.getPlayers();

    if (search) {
      players = players.filter(p =>
        p.username.toLowerCase().includes(search) ||
        p.id.toLowerCase().includes(search)
      );
    }

    const tbody = document.getElementById('adminPlayersBody');
    if (players.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">No players found.</td></tr>`;
      return;
    }

    tbody.innerHTML = players.map(p => {
      const sportsList = p.sports.map(s => {
        const emoji = Storage.getSportEmoji(s.sport);
        return `<span class="sport-tag">${emoji} ${s.sport} (${s.categories.length})</span>`;
      }).join(' ');

      return `
        <tr>
          <td><span style="font-family:var(--font-heading); color:var(--accent-primary); font-size:0.8rem;">${p.id}</span></td>
          <td><strong>${escapeHtml(p.username)}</strong></td>
          <td>${escapeHtml(p.gradeLevel)}</td>
          <td>${escapeHtml(p.section || '—')}</td>
          <td>${p.gender}</td>
          <td>${sportsList || '—'}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-secondary btn-icon" title="Edit" onclick="Admin.editPlayer('${p.id}')">✏️</button>
              <button class="btn btn-danger btn-icon" title="Delete" onclick="Admin.confirmDeletePlayer('${p.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function showAddPlayerModal() {
    const sportsConfig = Storage.getSportsConfig();
    const gradeOptions = Storage.getGradeLevels().map(g => `<option value="${g}">${g}</option>`).join('');
    const sportOptions = sportsConfig.map(s => `<option value="${s.sport}">${s.emoji} ${s.sport}</option>`).join('');

    const content = `
      <form id="adminAddPlayerForm">
        <div class="form-row">
          <div class="form-group">
            <label>Username *</label>
            <input type="text" id="aapUsername" required>
          </div>
          <div class="form-group">
            <label>Password *</label>
            <input type="password" id="aapPassword" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Grade Level *</label>
            <select id="aapGrade" required><option value="">Select...</option>${gradeOptions}</select>
          </div>
          <div class="form-group">
            <label>Section</label>
            <input type="text" id="aapSection" placeholder="e.g. Section A">
          </div>
        </div>
        <div class="form-group">
          <label>Gender *</label>
          <select id="aapGender" required>
            <option value="">Select...</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>
        </div>
        <div class="form-group">
          <label>Sport *</label>
          <select id="aapSport" required><option value="">Select...</option>${sportOptions}</select>
        </div>
        <div class="form-group" id="aapCatGroup" style="display:none;">
          <label>Categories *</label>
          <div class="checkbox-group" id="aapCategories"></div>
        </div>
        <div class="form-error" id="aapError"></div>
        <button type="submit" class="btn btn-primary btn-full">Add Player</button>
      </form>
    `;

    App.openModal('Add Player', content);

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
    });
  }

  function editPlayer(playerId) {
    const player = Storage.getPlayerById(playerId);
    if (!player) return;

    const gradeOptions = Storage.getGradeLevels().map(g =>
      `<option value="${g}" ${g === player.gradeLevel ? 'selected' : ''}>${g}</option>`
    ).join('');

    const content = `
      <form id="editPlayerForm">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="epUsername" value="${escapeHtml(player.username)}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Grade Level</label>
            <select id="epGrade" required>${gradeOptions}</select>
          </div>
          <div class="form-group">
            <label>Section</label>
            <input type="text" id="epSection" value="${escapeHtml(player.section || '')}">
          </div>
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select id="epGender" required>
            <option value="Men" ${player.gender === 'Men' ? 'selected' : ''}>Men</option>
            <option value="Women" ${player.gender === 'Women' ? 'selected' : ''}>Women</option>
          </select>
        </div>
        <div class="form-error" id="epError"></div>
        <button type="submit" class="btn btn-primary btn-full">Save Changes</button>
      </form>
    `;

    App.openModal(`Edit Player — ${player.id}`, content);

    document.getElementById('editPlayerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('epUsername').value.trim();
      const gradeLevel = document.getElementById('epGrade').value;
      const section = document.getElementById('epSection').value.trim();
      const gender = document.getElementById('epGender').value;
      const errorEl = document.getElementById('epError');

      if (!username) { errorEl.textContent = 'Username is required.'; return; }

      // Check if username is taken by another player
      const existing = Storage.getPlayerByUsername(username);
      if (existing && existing.id !== playerId) {
        errorEl.textContent = 'Username already taken.';
        return;
      }

      Storage.updatePlayer(playerId, { username, gradeLevel, section, gender });
      App.closeModal();
      App.showToast('Player updated!', 'success');
      renderPlayersTable();
      App.updateSessionUI();
    });
  }

  function confirmDeletePlayer(playerId) {
    const player = Storage.getPlayerById(playerId);
    if (!player) return;

    const content = `
      <p style="margin-bottom:1rem;">Are you sure you want to delete <strong>${escapeHtml(player.username)}</strong> (${player.id})? This cannot be undone.</p>
      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-danger btn-full" onclick="Admin.deletePlayer('${playerId}')">Delete</button>
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">Cancel</button>
      </div>
    `;

    App.openModal('Confirm Delete', content);
  }

  function deletePlayer(playerId) {
    Storage.deletePlayer(playerId);
    App.closeModal();
    App.showToast('Player deleted.', 'info');
    renderPlayersTable();
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
    const current = selectEl.value;
    while (selectEl.options.length > 1) selectEl.remove(1);
    Storage.getSportsConfig().forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.sport;
      opt.textContent = `${s.emoji} ${s.sport}`;
      selectEl.appendChild(opt);
    });
    selectEl.value = current || '';
  }

  function populateSelectCategories(sport, selectEl) {
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
    while (selectEl.options.length > 1) selectEl.remove(1);
    if (!sport || !category) return;

    const players = Storage.getPlayers();
    players.forEach(p => {
      const hasSportCat = p.sports.some(s =>
        s.sport === sport && s.categories.some(c => c.category === category)
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
      const sportData = p.sports.find(s => s.sport === sport);
      if (!sportData) return;
      const catData = sportData.categories.find(c => c.category === category);
      if (!catData) return;

      eligible.push({
        id: p.id,
        username: p.username,
        wins: catData.wins,
        losses: catData.losses,
        winrate: Storage.getWinrate(catData.wins, catData.losses),
        rank: catData.rank,
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
    const sport = document.getElementById('rankSport').value;
    const category = document.getElementById('rankCategory').value;
    const input = document.getElementById(`rank-input-${playerId}`);
    const rank = parseInt(input.value) || 0;

    if (Storage.setPlayerRank(playerId, sport, category, rank)) {
      App.showToast(`Rank updated to #${rank}!`, 'success');
      renderRanksTable();
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
      const emoji = Storage.getSportEmoji(event.sport);
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
              <button class="btn btn-danger btn-icon" onclick="Admin.confirmDeleteEvent('${event.id}')" title="Delete">🗑️</button>
            </div>
          </div>
          <div class="event-meta">
            <span>${emoji} ${escapeHtml(event.sport)}</span>
            <span>📂 ${escapeHtml(event.category)}</span>
            <span>📅 ${event.date}</span>
            <span>🏟️ ${event.matches ? event.matches.length : 0} matches</span>
          </div>
          <div style="margin-top:0.75rem;">
            <button class="btn btn-secondary btn-sm" onclick="Admin.showAddMatchToEvent('${event.id}')">+ Add Match Result</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function showAddEventModal() {
    const sportsConfig = Storage.getSportsConfig();
    const sportOptions = sportsConfig.map(s => `<option value="${s.sport}">${s.emoji} ${s.sport}</option>`).join('');

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
      App.showToast('Event created!', 'success');
      renderAdminEvents();
    });
  }

  function showAddMatchToEvent(eventId) {
    const event = Storage.getEventById(eventId);
    if (!event) return;

    // Get players in this sport + category
    const players = Storage.getPlayers().filter(p =>
      p.sports.some(s => s.sport === event.sport && s.categories.some(c => c.category === event.category))
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
      App.showToast('Match recorded and player stats updated!', 'success');
      renderAdminEvents();
    });
  }

  function updateEventStatus(eventId, status) {
    Storage.updateEvent(eventId, { status });
    App.showToast(`Event status updated to ${status}.`, 'info');
  }

  function confirmDeleteEvent(eventId) {
    const event = Storage.getEventById(eventId);
    if (!event) return;

    const content = `
      <p style="margin-bottom:1rem;">Delete event <strong>${escapeHtml(event.name)}</strong>? This won't undo player stats.</p>
      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-danger btn-full" onclick="Admin.deleteEvent('${eventId}')">Delete</button>
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">Cancel</button>
      </div>
    `;
    App.openModal('Confirm Delete Event', content);
  }

  function deleteEvent(eventId) {
    Storage.deleteEvent(eventId);
    App.closeModal();
    App.showToast('Event deleted.', 'info');
    renderAdminEvents();
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
          <span class="sport-config-name">${s.emoji} ${escapeHtml(s.sport)}</span>
          <div class="action-btns">
            <button class="btn btn-secondary btn-sm" onclick="Admin.showAddCategoryModal(${idx})">+ Category</button>
            <button class="btn btn-danger btn-icon" onclick="Admin.confirmDeleteSport(${idx})" title="Delete sport">🗑️</button>
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
    const content = `
      <form id="addNewSportForm">
        <div class="form-group">
          <label>Sport Name *</label>
          <input type="text" id="newSportName" placeholder="e.g. Swimming" required>
        </div>
        <div class="form-group">
          <label>Emoji</label>
          <input type="text" id="newSportEmoji" placeholder="e.g. 🏊" maxlength="4">
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
      const name = document.getElementById('newSportName').value.trim();
      const emoji = document.getElementById('newSportEmoji').value.trim() || '🏅';
      const catsStr = document.getElementById('newSportCats').value.trim();

      if (!name || !catsStr) {
        App.showToast('Please fill in all fields.', 'error');
        return;
      }

      const categories = catsStr.split(',').map(c => c.trim()).filter(c => c);
      const config = Storage.getSportsConfig();
      config.push({ sport: name, emoji, categories });
      Storage.updateSportsConfig(config);

      App.closeModal();
      App.showToast(`Sport "${name}" added!`, 'success');
      renderSportsConfig();

      // Refresh all sport dropdowns
      App.populateSportFilter();
      Auth.refreshSportDropdown();
    });
  }

  function showAddCategoryModal(sportIndex) {
    const config = Storage.getSportsConfig();
    const sport = config[sportIndex];

    const content = `
      <form id="addCatForm">
        <div class="form-group">
          <label>New Category for ${sport.emoji} ${escapeHtml(sport.sport)}</label>
          <input type="text" id="newCatName" placeholder="e.g. Mixed Doubles" required>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Add Category</button>
      </form>
    `;

    App.openModal('Add Category', content);

    document.getElementById('addCatForm').addEventListener('submit', (e) => {
      e.preventDefault();
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
      App.showToast(`Category "${catName}" added!`, 'success');
      renderSportsConfig();
    });
  }

  function removeCategory(sportIndex, category) {
    const config = Storage.getSportsConfig();
    config[sportIndex].categories = config[sportIndex].categories.filter(c => c !== category);
    Storage.updateSportsConfig(config);
    App.showToast('Category removed.', 'info');
    renderSportsConfig();
  }

  function confirmDeleteSport(sportIndex) {
    const config = Storage.getSportsConfig();
    const sport = config[sportIndex];

    const content = `
      <p style="margin-bottom:1rem;">Delete sport <strong>${sport.emoji} ${escapeHtml(sport.sport)}</strong> and all its categories?</p>
      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-danger btn-full" onclick="Admin.deleteSport(${sportIndex})">Delete</button>
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">Cancel</button>
      </div>
    `;
    App.openModal('Confirm Delete Sport', content);
  }

  function deleteSport(sportIndex) {
    const config = Storage.getSportsConfig();
    config.splice(sportIndex, 1);
    Storage.updateSportsConfig(config);
    App.closeModal();
    App.showToast('Sport deleted.', 'info');
    renderSportsConfig();
    App.populateSportFilter();
    Auth.refreshSportDropdown();
  }

  // ═══════ SETTINGS ═══════
  function setupSettings() {
    // Change password
    document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
      e.preventDefault();
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
      App.showToast('Admin password changed!', 'success');
      e.target.reset();
    });

    // Export
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      const data = Storage.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `varsity_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      App.showToast('Data exported!', 'success');
    });

    // Import
    document.getElementById('importDataBtn').addEventListener('click', () => {
      document.getElementById('importDataInput').click();
    });

    document.getElementById('importDataInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          Storage.importData(data);
          App.showToast('Data imported successfully!', 'success');
          App.populateSportFilter();
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
      const content = `
        <p style="margin-bottom:1rem; color:var(--color-loss);">⚠️ This will permanently delete ALL players, events, and reset settings. This cannot be undone!</p>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-danger btn-full" onclick="Admin.clearAllData()">Yes, Delete Everything</button>
          <button class="btn btn-secondary btn-full" onclick="App.closeModal()">Cancel</button>
        </div>
      `;
      App.openModal('⚠️ Clear All Data', content);
    });
  }

  function clearAllData() {
    localStorage.clear();
    Storage.init();
    App.closeModal();
    App.showToast('All data cleared.', 'info');
    App.populateSportFilter();
    Auth.refreshSportDropdown();
    App.updateSessionUI();
    renderPlayersTable();
  }

  // ─── Helpers ───
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  // ─── Public API ───
  return {
    init,
    editPlayer,
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
