/**
 * cards.js — Player Cards Module
 * Renders visual player cards with Grid / List layout switcher and sorting.
 */

const Cards = (() => {
  let currentSort = 'rank-asc';
  let currentLayout = localStorage.getItem('varsity_cards_layout') || 'grid';

  function init() {
    const sortSelect = document.getElementById('cardsSortSelect');
    if (sortSelect) {
      sortSelect.value = currentSort;
      sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        render();
      });
    }

    const gridBtn = document.getElementById('layoutGridBtn');
    const listBtn = document.getElementById('layoutListBtn');

    if (gridBtn && listBtn) {
      gridBtn.classList.toggle('active', currentLayout === 'grid');
      listBtn.classList.toggle('active', currentLayout === 'list');

      gridBtn.addEventListener('click', () => setLayout('grid'));
      listBtn.addEventListener('click', () => setLayout('list'));
    }
  }

  function setLayout(layout) {
    currentLayout = layout;
    localStorage.setItem('varsity_cards_layout', layout);
    const gridBtn = document.getElementById('layoutGridBtn');
    const listBtn = document.getElementById('layoutListBtn');
    if (gridBtn) gridBtn.classList.toggle('active', layout === 'grid');
    if (listBtn) listBtn.classList.toggle('active', layout === 'list');
    render();
  }

  function sortRows(rows, sortKey) {
    const list = [...rows];
    switch (sortKey) {
      case 'rank-asc':
        return list.sort((a, b) => {
          if (a.rank === 0 && b.rank === 0) return b.winrate - a.winrate;
          if (a.rank === 0) return 1;
          if (b.rank === 0) return -1;
          return a.rank - b.rank;
        });
      case 'rank-desc':
        return list.sort((a, b) => {
          if (a.rank === 0 && b.rank === 0) return b.winrate - a.winrate;
          if (a.rank === 0) return 1;
          if (b.rank === 0) return -1;
          return b.rank - a.rank;
        });
      case 'winrate-desc':
        return list.sort((a, b) => {
          if (b.winrate !== a.winrate) return b.winrate - a.winrate;
          return b.wins - a.wins;
        });
      case 'wins-desc':
        return list.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.winrate - a.winrate;
        });
      case 'name-asc':
        return list.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
      default:
        return list;
    }
  }

  function render() {
    const filters = App.getFilters();
    let rows = Storage.getFlatPlayerStats(filters);
    const grid = document.getElementById('cardsGrid');
    const emptyEl = document.getElementById('cardsEmpty');

    if (!grid) return;

    if (rows.length === 0) {
      grid.className = 'cards-grid';
      grid.innerHTML = '';
      if (emptyEl) {
        grid.appendChild(emptyEl);
        emptyEl.style.display = '';
      }
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    // Apply active sort
    rows = sortRows(rows, currentSort);

    // Apply layout class
    grid.className = currentLayout === 'list' ? 'cards-grid layout-list' : 'cards-grid';

    if (currentLayout === 'list') {
      grid.innerHTML = renderListCards(rows);
    } else {
      grid.innerHTML = renderGridCards(rows);
    }
  }

  function renderGridCards(rows) {
    return rows.map((row, idx) => {
      const rankTier = getRankTier(row.rank);
      const wrClass = row.winrate >= 60 ? 'high' : row.winrate >= 40 ? 'mid' : 'low';
      const initial = row.username ? row.username.charAt(0).toUpperCase() : 'P';
      const rankColorClass = row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : row.rank === 3 ? 'bronze' : 'default';

      let ribbonHTML = '';
      if (row.rank >= 1 && row.rank <= 3) {
        const ribbonClass = row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : 'bronze';
        const ribbonText = row.rank === 1 ? '1st' : row.rank === 2 ? '2nd' : '3rd';
        ribbonHTML = `<div class="card-rank-ribbon ${ribbonClass}">${ribbonText}</div>`;
      }

      const cardAvatarHTML = row.photo
        ? `<img src="${row.photo}" class="card-avatar-img" alt="${escapeHtml(row.username)}">`
        : `<span class="card-avatar-initial">${initial}</span>`;

      return `
        <div class="player-card ${rankTier}" 
             style="animation-delay: ${idx * 0.05}s"
             onclick="Cards.showDetail('${row.id}', '${escapeAttr(row.sport)}', '${escapeAttr(row.category)}')">
          ${ribbonHTML}
          <div class="card-header">
            <div class="card-avatar">${cardAvatarHTML}</div>
            <div class="card-rank-display">
              <div class="card-rank-label">Rank</div>
              <div class="card-rank-number ${rankColorClass}">${row.rank > 0 ? '#' + row.rank : '—'}</div>
            </div>
          </div>
          <div class="card-name">${escapeHtml(row.username)}</div>
          <div class="card-id">${row.id}</div>
          <div class="card-meta">
            <span class="card-meta-tag">${escapeHtml(row.sport)}</span>
            <span class="card-meta-tag">${escapeHtml(row.category)}</span>
            <span class="card-meta-tag">${escapeHtml(row.gradeLevel)}</span>
          </div>
          <div class="card-stats">
            <div class="card-stat">
              <div class="card-stat-value win-text">${row.wins}</div>
              <div class="card-stat-label">Wins</div>
            </div>
            <div class="card-stat">
              <div class="card-stat-value loss-text">${row.losses}</div>
              <div class="card-stat-label">Losses</div>
            </div>
            <div class="card-stat">
              <div class="card-stat-value" style="color: var(--text-primary)">${row.winrate}%</div>
              <div class="card-stat-label">Winrate</div>
            </div>
          </div>
          <div class="card-winrate-bar">
            <div class="card-winrate-fill ${wrClass}" style="width: ${row.winrate}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderListCards(rows) {
    return rows.map((row, idx) => {
      const rankTier = getRankTier(row.rank);
      const initial = row.username ? row.username.charAt(0).toUpperCase() : 'P';
      const rankDisplay = row.rank > 0 ? '#' + row.rank : '—';
      const rankClass = getRankClass(row.rank);

      const avatarHTML = row.photo
        ? `<img src="${row.photo}" class="list-avatar-img" alt="${escapeHtml(row.username)}">`
        : `<div class="list-avatar-initial">${initial}</div>`;

      return `
        <div class="player-card-list-item ${rankTier}" 
             style="animation-delay: ${idx * 0.03}s"
             onclick="Cards.showDetail('${row.id}', '${escapeAttr(row.sport)}', '${escapeAttr(row.category)}')">
          <div class="list-card-left">
            <span class="rank-badge ${rankClass}">${rankDisplay}</span>
            <div class="list-avatar">${avatarHTML}</div>
            <div class="list-player-info">
              <div class="list-player-name">${escapeHtml(row.username)}</div>
              <div class="list-player-id">${row.id}</div>
            </div>
          </div>

          <div class="list-card-meta">
            <span class="card-meta-tag">${escapeHtml(row.sport)}</span>
            <span class="card-meta-tag">${escapeHtml(row.category)}</span>
            <span class="card-meta-tag">${escapeHtml(row.gradeLevel)}</span>
          </div>

          <div class="list-card-stats">
            <div class="list-stat-pill">
              <span class="win-text">W: ${row.wins}</span>
              <span class="loss-text">L: ${row.losses}</span>
              <span class="list-wr">${row.winrate}% WR</span>
            </div>
            <button class="btn btn-secondary btn-sm list-detail-btn" type="button">Card</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function getRankTier(rank) {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  }

  function getRankClass(rank) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    if (rank > 0) return 'rank-other';
    return 'rank-none';
  }

  function showDetail(playerId, sport, category) {
    const player = Storage.getPlayerById(playerId);
    if (!player) return;

    const sportData = player.sports ? player.sports.find(s => s.sport === sport) : null;
    if (!sportData) return;

    const catData = sportData.categories ? sportData.categories.find(c => (c.category || c) === category) : null;
    if (!catData) return;

    const wr = Storage.getWinrate(catData.wins || 0, catData.losses || 0);
    const wrClass = wr >= 60 ? 'high' : wr >= 40 ? 'mid' : 'low';

    let historyHTML = '';
    if (catData.matchHistory && catData.matchHistory.length > 0) {
      historyHTML = `
        <h4 style="margin-top:1.5rem; margin-bottom:0.75rem; font-size:0.9rem; color:var(--text-secondary)">Match History</h4>
        <div class="match-history-list">
          ${catData.matchHistory.slice().reverse().map(m => `
            <div class="match-history-item">
              <span class="match-result-badge ${m.result === 'W' ? 'win' : 'loss'}">
                ${m.result === 'W' ? 'WIN' : 'LOSS'}
              </span>
              <span class="match-opponent">${m.opponent ? 'vs ' + escapeHtml(m.opponent) : ''}</span>
              ${m.event ? `<span class="match-event-name">${escapeHtml(m.event)}</span>` : ''}
              <span class="match-date">${m.date || ''}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      historyHTML = '<p style="color:var(--text-muted); font-size:0.85rem; margin-top:1rem;">No match history yet.</p>';
    }

    const modalAvatarHTML = player.photo
      ? `<img src="${player.photo}" class="profile-avatar-img" alt="${escapeHtml(player.username)}">`
      : `<span style="font-size:1.75rem; font-weight:800; color:#fff;">${player.username ? player.username.charAt(0).toUpperCase() : 'P'}</span>`;

    const content = `
      <div style="text-align:center; margin-bottom:1.5rem;">
        <div class="card-avatar" style="width:72px; height:72px; margin:0 auto 0.75rem; overflow:hidden;">
          ${modalAvatarHTML}
        </div>
        <div style="font-size:1.25rem; font-weight:700; font-family:var(--font-heading);">${escapeHtml(player.username)}</div>
        <div style="color:var(--accent-primary); font-size:0.8rem; letter-spacing:0.5px;">${player.id}</div>
        <div style="margin-top:0.5rem; display:flex; justify-content:center; gap:0.4rem; flex-wrap:wrap;">
          <span class="card-meta-tag">${escapeHtml(sport)}</span>
          <span class="card-meta-tag">${escapeHtml(category)}</span>
          <span class="card-meta-tag">${escapeHtml(player.gradeLevel)}</span>
          <span class="card-meta-tag">${escapeHtml(player.gender)}</span>
        </div>
      </div>
      <div class="card-stats" style="max-width:300px; margin:0 auto 1rem;">
        <div class="card-stat">
          <div class="card-stat-value win-text">${catData.wins || 0}</div>
          <div class="card-stat-label">Wins</div>
        </div>
        <div class="card-stat">
          <div class="card-stat-value loss-text">${catData.losses || 0}</div>
          <div class="card-stat-label">Losses</div>
        </div>
        <div class="card-stat">
          <div class="card-stat-value">${wr}%</div>
          <div class="card-stat-label">Winrate</div>
        </div>
      </div>
      <div class="card-winrate-bar" style="max-width:300px; margin:0 auto;">
        <div class="card-winrate-fill ${wrClass}" style="width:${wr}%"></div>
      </div>
      <div style="text-align:center; margin-top:0.75rem;">
        <span style="font-size:0.8rem; color:var(--text-muted);">Rank: </span>
        <span style="font-weight:800; font-family:var(--font-heading); font-size:1.1rem;">
          ${catData.rank > 0 ? '#' + catData.rank : 'Unranked'}
        </span>
      </div>
      <div style="text-align:center; margin-top:1.25rem;">
        <button class="btn btn-primary btn-sm" onclick="Cards.downloadCard('${player.id}', '${escapeAttr(sport)}', '${escapeAttr(category)}')">
          Download Card (PNG)
        </button>
      </div>
      ${historyHTML}
    `;

    App.openModal(`${player.username} — ${category}`, content);
  }

  function downloadCard(playerId, sport, category) {
    const player = Storage.getPlayerById(playerId);
    if (!player) return;
    const sportData = player.sports ? player.sports.find(s => s.sport === sport) : null;
    if (!sportData) return;
    const catData = sportData.categories ? sportData.categories.find(c => (c.category || c) === category) : null;
    if (!catData) return;

    const wins = catData.wins || 0;
    const losses = catData.losses || 0;
    const wr = Storage.getWinrate(wins, losses);
    const total = wins + losses;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 1100;

    // Helper to finish and trigger download
    const finishDownload = (photoImg) => {
      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 800, 1100);
      bgGrad.addColorStop(0, '#0a0e1a');
      bgGrad.addColorStop(0.5, '#131b2e');
      bgGrad.addColorStop(1, '#080c16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 1100);

      // Decorative outer border with rank styling
      const borderGrad = ctx.createLinearGradient(0, 0, 800, 1100);
      let accentColor = '#6366f1';
      if (catData.rank === 1) {
        borderGrad.addColorStop(0, '#fbbf24');
        borderGrad.addColorStop(1, '#d97706');
        accentColor = '#fbbf24';
      } else if (catData.rank === 2) {
        borderGrad.addColorStop(0, '#e2e8f0');
        borderGrad.addColorStop(1, '#94a3b8');
        accentColor = '#cbd5e1';
      } else if (catData.rank === 3) {
        borderGrad.addColorStop(0, '#f59e0b');
        borderGrad.addColorStop(1, '#92400e');
        accentColor = '#d97706';
      } else {
        borderGrad.addColorStop(0, '#6366f1');
        borderGrad.addColorStop(1, '#8b5cf6');
      }

      // Outer frame
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 12;
      ctx.strokeRect(24, 24, 752, 1052);

      // Inner subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, 728, 1028);

      // Header title
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFFICIAL ATHLETE SET CARD', 400, 85);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px Inter, sans-serif';
      ctx.fillText('VARSITY SPORTS PERFORMANCE TRACKER', 400, 115);

      // Avatar circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(400, 240, 90, 0, Math.PI * 2);
      ctx.clip();

      if (photoImg) {
        ctx.drawImage(photoImg, 310, 150, 180, 180);
      } else {
        ctx.fillStyle = borderGrad;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 90px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.username ? player.username.charAt(0).toUpperCase() : 'P', 400, 240);
      }
      ctx.restore();

      // Avatar ring border
      ctx.save();
      ctx.beginPath();
      ctx.arc(400, 240, 90, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = accentColor;
      ctx.stroke();
      ctx.restore();

      // Rank Badge
      ctx.save();
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 36px Outfit, Inter, sans-serif';
      ctx.textAlign = 'center';
      const rankText = catData.rank > 0 ? `RANK #${catData.rank}` : 'UNRANKED';
      ctx.fillText(rankText, 400, 380);
      ctx.restore();

      // Player Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px Outfit, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((player.username || '').toUpperCase(), 400, 440);

      // Player ID
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`ID: ${player.id}`, 400, 480);

      // Meta tags box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(80, 520, 640, 75);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(80, 520, 640, 75);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${sport} — ${category}`, 400, 552);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`${player.gradeLevel || ''} • ${player.gender || ''}`, 400, 580);

      // Stats Grid
      const statBoxY = 630;
      const statW = 190;
      const statH = 140;

      drawStatBox(ctx, 80, statBoxY, statW, statH, String(wins), 'WINS', '#10b981');
      drawStatBox(ctx, 305, statBoxY, statW, statH, String(losses), 'LOSSES', '#f43f5e');
      drawStatBox(ctx, 530, statBoxY, statW, statH, `${wr}%`, 'WINRATE', accentColor);

      // Winrate Progress Bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(80, 800, 640, 20);
      ctx.fillStyle = wr >= 60 ? '#10b981' : (wr >= 40 ? '#fbbf24' : '#f43f5e');
      ctx.fillRect(80, 800, Math.round(640 * (wr / 100)), 20);

      // Total Matches
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Total Matches Played: ${total}`, 400, 850);

      // Security Watermark & Timestamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.font = 'bold 80px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VERIFIED', 400, 960);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px monospace';
      ctx.fillText(`GENERATED: ${new Date().toLocaleDateString()} • VARSITY TRACKER`, 400, 1020);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `${(player.username || 'athlete').replace(/\s+/g, '_')}_${sport}_SetCard.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      App.showToast('Digital Player Card downloaded.', 'success');
    };

    if (player.photo) {
      const img = new Image();
      img.onload = () => finishDownload(img);
      img.onerror = () => finishDownload(null);
      img.src = player.photo;
    } else {
      finishDownload(null);
    }
  }

  function drawStatBox(ctx, x, y, w, h, value, label, valueColor) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = valueColor;
    ctx.font = 'bold 44px Outfit, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(value, x + w / 2, y + 65);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(label, x + w / 2, y + 105);
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
    setLayout,
    showDetail,
    downloadCard,
  };
})();
