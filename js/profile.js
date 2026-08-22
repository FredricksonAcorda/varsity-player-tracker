/**
 * profile.js — My Profile Module
 * Shows the logged-in player's profile card, photo upload, stats per sport/category,
 * profile editing, and match history.
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
      authSection.style.display = 'block';
      profileSection.style.display = 'none';
      return;
    }

    authSection.style.display = 'none';
    profileSection.style.display = 'block';

    // Auto-select first sport/category if not set or invalid
    if (player.sports && player.sports.length > 0) {
      const hasCurrentSport = player.sports.some(s => s.sport === selectedSport);
      if (!selectedSport || !hasCurrentSport) {
        selectedSport = player.sports[0].sport;
      }
      const sportObj = player.sports.find(s => s.sport === selectedSport);
      if (sportObj && sportObj.categories && sportObj.categories.length > 0) {
        const hasCurrentCat = sportObj.categories.some(c => (c.category || c) === selectedCategory);
        if (!selectedCategory || !hasCurrentCat) {
          selectedCategory = sportObj.categories[0].category || sportObj.categories[0];
        }
      } else {
        selectedCategory = null;
      }
    } else {
      selectedSport = null;
      selectedCategory = null;
    }

    renderProfileCard(player);
    renderSportTabs(player);
    renderStats(player);
    renderMatchHistory(player);
  }

  function renderProfileCard(player) {
    const card = document.getElementById('profileCard');
    if (!card) return;

    const initial = player.username ? player.username.charAt(0).toUpperCase() : 'P';
    
    // Avatar image or initial
    const avatarHTML = player.photo
      ? `<img src="${player.photo}" alt="${escapeHtml(player.username)}" class="profile-avatar-img">`
      : `<span class="profile-avatar-initial">${initial}</span>`;

    // Collect all sports tags
    const sportTags = (player.sports && player.sports.length > 0)
      ? player.sports.map(s => {
          return (s.categories || []).map(c => 
            `<span class="card-meta-tag">${escapeHtml(s.sport)} • ${escapeHtml(c.category || c)}</span>`
          ).join(' ');
        }).join(' ')
      : '<span style="color:var(--text-muted); font-size:0.8rem;">No sports assigned yet. Contact coach/admin.</span>';

    card.innerHTML = `
      <div class="profile-avatar-wrapper" onclick="Profile.triggerPhotoUpload()" title="Click to upload profile photo">
        <div class="profile-avatar-large">
          ${avatarHTML}
        </div>
        <div class="avatar-edit-badge" title="Change photo">Edit</div>
      </div>
      <input type="file" id="playerPhotoUpload" accept="image/*" style="display:none;" onchange="Profile.handlePhotoFile(this)">
      
      <div class="profile-name">${escapeHtml(player.username)}</div>
      <div class="profile-id">${player.id}</div>
      
      <div class="profile-meta-row">
        <span class="card-meta-tag">${escapeHtml(player.gradeLevel || 'No Grade')}</span>
        ${player.section ? `<span class="card-meta-tag">${escapeHtml(player.section)}</span>` : ''}
      </div>
      
      <div class="profile-meta-row" style="margin-top:0.5rem;">
        ${sportTags}
      </div>

      <div class="profile-actions-row" style="margin-top:1.5rem; display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="Profile.showEditProfileModal()">
          Edit Profile
        </button>
        <button class="btn btn-primary btn-sm" onclick="Profile.downloadCurrentCard()">
          Download Card (PNG)
        </button>
      </div>
    `;
  }

  function triggerPhotoUpload() {
    const input = document.getElementById('playerPhotoUpload');
    if (input) input.click();
  }

  function handlePhotoFile(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const player = Storage.getCurrentPlayer();
    if (!player) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // Compress to 200x200 canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw image cropped to square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        Storage.updatePlayer(player.id, { photo: dataUrl });
        App.showToast('Profile photo updated.', 'success');
        App.updateSessionUI();
        render();
        // Also refresh leaderboard & cards if rendered
        Leaderboard.render();
        Cards.render();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function showEditProfileModal() {
    const player = Storage.getCurrentPlayer();
    if (!player) return;

    const gradeOptions = Storage.getGradeLevels().map(g =>
      `<option value="${g}" ${g === player.gradeLevel ? 'selected' : ''}>${g}</option>`
    ).join('');

    const content = `
      <form id="playerEditProfileForm">
        <div class="form-group" style="text-align:center; margin-bottom:1.5rem;">
          <div class="profile-avatar-large" style="margin:0 auto 0.75rem; width:72px; height:72px;">
            ${player.photo ? `<img src="${player.photo}" class="profile-avatar-img">` : `<span style="font-size:1.75rem;">${player.username.charAt(0).toUpperCase()}</span>`}
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="Profile.triggerPhotoUpload()">Upload Photo</button>
          ${player.photo ? `<button type="button" class="btn btn-ghost btn-sm" onclick="Profile.removePhoto()" style="color:var(--color-loss);">Remove Picture</button>` : ''}
        </div>

        <div class="form-group">
          <label>Username *</label>
          <input type="text" id="peUsername" value="${escapeHtml(player.username)}" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Grade Level *</label>
            <select id="peGrade" required>${gradeOptions}</select>
          </div>
          <div class="form-group">
            <label>Section / Team</label>
            <input type="text" id="peSection" value="${escapeHtml(player.section || '')}" placeholder="e.g. Section A">
          </div>
        </div>

        <div class="form-error" id="peError"></div>
        <button type="submit" class="btn btn-primary btn-full">Save Changes</button>
      </form>
    `;

    App.openModal('Edit Athlete Profile', content);

    document.getElementById('playerEditProfileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('peUsername').value.trim();
      const gradeLevel = document.getElementById('peGrade').value;
      const section = document.getElementById('peSection').value.trim();
      const errorEl = document.getElementById('peError');

      if (!username) {
        errorEl.textContent = 'Username is required.';
        return;
      }

      // Check if username taken by another user
      const existing = Storage.getPlayerByUsername(username);
      if (existing && existing.id !== player.id) {
        errorEl.textContent = 'This username is already taken by another athlete.';
        return;
      }

      Storage.updatePlayer(player.id, { username, gradeLevel, section });
      App.closeModal();
      App.showToast('Profile updated successfully.', 'success');
      App.updateSessionUI();
      render();
      Leaderboard.render();
      Cards.render();
    });
  }

  function removePhoto() {
    const player = Storage.getCurrentPlayer();
    if (!player) return;
    Storage.updatePlayer(player.id, { photo: '' });
    App.showToast('Profile photo removed.', 'info');
    App.closeModal();
    App.updateSessionUI();
    render();
    Leaderboard.render();
    Cards.render();
  }

  function renderSportTabs(player) {
    const tabsContainer = document.getElementById('profileSportTabs');
    if (!tabsContainer) return;
    const tabs = [];

    if (player.sports && player.sports.length > 0) {
      player.sports.forEach(s => {
        if (s.categories && s.categories.length > 0) {
          s.categories.forEach(c => {
            const catName = c.category || c;
            tabs.push({
              sport: s.sport,
              category: catName,
              label: `${s.sport} — ${catName}`,
            });
          });
        }
      });
    }

    if (tabs.length === 0) {
      tabsContainer.innerHTML = '';
      return;
    }

    tabsContainer.innerHTML = tabs.map(t => {
      const isActive = t.sport === selectedSport && t.category === selectedCategory;
      return `
        <button class="profile-sport-tab ${isActive ? 'active' : ''}" 
                onclick="Profile.selectCategory('${escapeAttr(t.sport)}', '${escapeAttr(t.category)}')">
          ${escapeHtml(t.label)}
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
    if (!container) return;

    if (!selectedSport || !selectedCategory) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">No sport categories assigned yet. An admin or coach will assign your categories.</p>';
      return;
    }

    const sportData = player.sports ? player.sports.find(s => s.sport === selectedSport) : null;
    if (!sportData) {
      container.innerHTML = '';
      return;
    }

    const catData = sportData.categories ? sportData.categories.find(c => (c.category || c) === selectedCategory) : null;
    if (!catData) {
      container.innerHTML = '';
      return;
    }

    const wins = catData.wins || 0;
    const losses = catData.losses || 0;
    const wr = Storage.getWinrate(wins, losses);
    const total = wins + losses;
    const rank = catData.rank || 0;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-value win-text count-up">${wins}</div>
        <div class="stat-card-label">Wins</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value loss-text count-up">${losses}</div>
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
        <div class="stat-card-value count-up">${rank > 0 ? '#' + rank : '—'}</div>
        <div class="stat-card-label">Rank</div>
      </div>
    `;
  }

  function renderMatchHistory(player) {
    const container = document.getElementById('matchHistoryList');
    if (!container) return;

    if (!selectedSport || !selectedCategory) {
      container.innerHTML = '';
      return;
    }

    const sportData = player.sports ? player.sports.find(s => s.sport === selectedSport) : null;
    if (!sportData) { container.innerHTML = ''; return; }

    const catData = sportData.categories ? sportData.categories.find(c => (c.category || c) === selectedCategory) : null;
    if (!catData || !catData.matchHistory || catData.matchHistory.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:1rem 0;">No match history yet.</p>';
      return;
    }

    container.innerHTML = catData.matchHistory.slice().reverse().map(m => `
      <div class="match-history-item">
        <span class="match-result-badge ${m.result === 'W' ? 'win' : 'loss'}">
          ${m.result === 'W' ? 'WIN' : 'LOSS'}
        </span>
        <span class="match-opponent">${m.opponent ? 'vs ' + escapeHtml(m.opponent) : ''}</span>
        ${m.event ? `<span class="match-event-name">${escapeHtml(m.event)}</span>` : ''}
        <span class="match-date">${m.date || ''}</span>
      </div>
    `).join('');
  }

  function downloadCurrentCard() {
    const player = Storage.getCurrentPlayer();
    if (!player) {
      App.showToast('Please log in first.', 'error');
      return;
    }
    if (!selectedSport || !selectedCategory) {
      App.showToast('No sport category assigned to generate a card.', 'error');
      return;
    }
    Cards.downloadCard(player.id, selectedSport, selectedCategory);
  }

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

  return {
    init,
    render,
    selectCategory,
    triggerPhotoUpload,
    handlePhotoFile,
    showEditProfileModal,
    removePhoto,
    downloadCurrentCard,
  };
})();
