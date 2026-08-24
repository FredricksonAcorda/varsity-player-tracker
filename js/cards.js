/**
 * cards.js — Player Cards Module
 * Renders visual player cards with Grid / List layout switcher and sorting.
 */

const Cards = (() => {
  let currentSortKey = 'rank';
  let currentSortOrder = 'asc';
  let currentLayout = localStorage.getItem('varsity_cards_layout') || 'grid';

  function init() {
    const sortSelect = document.getElementById('cardsSortSelect');
    const orderBtn = document.getElementById('cardsOrderBtn');

    if (sortSelect) {
      sortSelect.value = currentSortKey;
      sortSelect.addEventListener('change', () => {
        currentSortKey = sortSelect.value;
        render();
      });
    }

    if (orderBtn) {
      orderBtn.textContent = currentSortOrder === 'asc' ? 'Asc' : 'Desc';
      orderBtn.addEventListener('click', () => {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        orderBtn.textContent = currentSortOrder === 'asc' ? 'Asc' : 'Desc';
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

  function sortRows(rows, sortKey, order) {
    const list = [...rows];
    let comparator;

    if (sortKey === 'rank') {
      comparator = (a, b) => {
        if (a.rank === 0 && b.rank === 0) return b.winrate - a.winrate;
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return order === 'asc' ? a.rank - b.rank : b.rank - a.rank;
      };
    } else if (sortKey === 'winrate') {
      comparator = (a, b) => {
        if (b.winrate !== a.winrate) {
          return order === 'asc' ? a.winrate - b.winrate : b.winrate - a.winrate;
        }
        return order === 'asc' ? a.wins - b.wins : b.wins - a.wins;
      };
    } else if (sortKey === 'wins') {
      comparator = (a, b) => {
        if (b.wins !== a.wins) {
          return order === 'asc' ? a.wins - b.wins : b.wins - a.wins;
        }
        return order === 'asc' ? a.winrate - b.winrate : b.winrate - a.winrate;
      };
    } else if (sortKey === 'name') {
      comparator = (a, b) => {
        const res = (a.username || '').localeCompare(b.username || '');
        return order === 'asc' ? res : -res;
      };
    } else {
      comparator = () => 0;
    }

    return list.sort(comparator);
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

    // Apply active sort and direction
    rows = sortRows(rows, currentSortKey, currentSortOrder);

    // Tag logged-in athlete's card naturally in the list without forcing it to pin at index 0
    const session = Storage.getSession();
    if (session && session.playerId) {
      rows = rows.map(r => ({
        ...r,
        isMyCard: r.id === session.playerId
      }));
    }

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
      const isRanked = row.rank > 0 && (row.wins + row.losses > 0);
      const rankTier = isRanked ? getRankTier(row.rank, row.wins, row.losses) : '';
      const wrClass = row.winrate >= 60 ? 'high' : row.winrate >= 40 ? 'mid' : 'low';
      const initial = row.username ? row.username.charAt(0).toUpperCase() : 'P';
      const rankColorClass = isRanked ? (row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : row.rank === 3 ? 'bronze' : 'default') : 'default';

      const cardAvatarHTML = row.photo
        ? `<img src="${row.photo}" class="card-avatar-img" alt="${escapeHtml(row.username)}">`
        : `<span class="card-avatar-initial">${initial}</span>`;

      const rankDisplayHTML = isRanked ? `#${row.rank}` : '—';

      return `
        <div class="player-card ${rankTier} ${row.isMyCard ? 'is-my-card' : ''}" 
             style="animation-delay: ${idx * 0.04}s"
             onclick="Cards.showDetail('${row.id}', '${escapeAttr(row.sport)}', '${escapeAttr(row.category)}')">
          
          <!-- Card Header / Identity -->
          <div class="card-header">
            <div class="card-avatar">${cardAvatarHTML}</div>
            <div class="card-identity">
              <div class="card-name" title="${escapeHtml(row.username)}">${escapeHtml(row.username)}</div>
              <div class="card-id">${row.id}</div>
            </div>
            <div class="card-rank-badge ${rankColorClass}">
              <span class="rank-badge-label">RANK</span>
              <span class="rank-badge-num">${rankDisplayHTML}</span>
            </div>
          </div>

          <!-- Card Tags -->
          <div class="card-tags-row">
            <span class="card-meta-tag sport">${escapeHtml(row.sport)}</span>
            <span class="card-meta-tag category">${escapeHtml(row.category)}</span>
            <span class="card-meta-tag grade">${escapeHtml(row.gradeLevel)}</span>
          </div>

          <!-- Card Stats Grid -->
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
              <div class="card-stat-value winrate-val">${row.winrate}%</div>
              <div class="card-stat-label">Winrate</div>
            </div>
          </div>

          <!-- Winrate Bar -->
          <div class="card-winrate-bar">
            <div class="card-winrate-fill ${wrClass}" style="width: ${row.winrate}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderListCards(rows) {
    return rows.map((row, idx) => {
      const isRanked = row.rank > 0 && (row.wins + row.losses > 0);
      const rankTier = isRanked ? getRankTier(row.rank, row.wins, row.losses) : '';
      const initial = row.username ? row.username.charAt(0).toUpperCase() : 'P';
      const rankDisplay = isRanked ? `#${row.rank}` : '—';
      const rankClass = isRanked ? getRankClass(row.rank) : 'rank-none';

      const avatarHTML = row.photo
        ? `<img src="${row.photo}" class="list-avatar-img" alt="${escapeHtml(row.username)}">`
        : `<div class="list-avatar-initial">${initial}</div>`;

      return `
        <div class="player-card-list-item ${rankTier} ${row.isMyCard ? 'is-my-card' : ''}" 
             style="animation-delay: ${idx * 0.03}s"
             onclick="Cards.showDetail('${row.id}', '${escapeAttr(row.sport)}', '${escapeAttr(row.category)}')">
          <div class="list-card-left">
            <span class="rank-badge ${rankClass}">${rankDisplay}</span>
            <div class="list-avatar">${avatarHTML}</div>
            <div class="list-player-info">
              <span class="list-player-name">${escapeHtml(row.username)}</span>
              <span class="list-player-id">${row.id}</span>
            </div>
          </div>

          <div class="list-card-meta">
            <span class="card-meta-tag sport">${escapeHtml(row.sport)}</span>
            <span class="card-meta-tag category">${escapeHtml(row.category)}</span>
            <span class="card-meta-tag grade">${escapeHtml(row.gradeLevel)}</span>
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

  function getRankTier(rank, wins = 0, losses = 0) {
    if (wins + losses === 0) return '';
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

    const wins = catData.wins || 0;
    const losses = catData.losses || 0;
    const isRanked = catData.rank > 0 && (wins + losses > 0);
    const wr = Storage.getWinrate(wins, losses);
    const wrClass = wr >= 60 ? 'high' : wr >= 40 ? 'mid' : 'low';
    const rankColorClass = isRanked ? (catData.rank === 1 ? 'gold' : catData.rank === 2 ? 'silver' : catData.rank === 3 ? 'bronze' : 'default') : 'default';
    const rankDisplayHTML = isRanked ? `#${catData.rank}` : '—';
    const initial = player.username ? player.username.charAt(0).toUpperCase() : 'P';

    let historyHTML = '';
    if (catData.matchHistory && catData.matchHistory.length > 0) {
      historyHTML = `
        <div class="modal-history-section">
          <h4 class="modal-subheading">Match History</h4>
          <div class="match-history-list">
            ${catData.matchHistory.slice().reverse().map(m => `
              <div class="match-history-item">
                <span class="match-result-badge ${m.result === 'W' ? 'win' : 'loss'}">
                  ${m.result === 'W' ? 'WIN' : 'LOSS'}
                </span>
                <span class="match-opponent">${m.opponent ? 'vs ' + escapeHtml(m.opponent) : 'Official Match'}</span>
                ${m.event ? `<span class="match-event-name">${escapeHtml(m.event)}</span>` : ''}
                <span class="match-date">${m.date || ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      historyHTML = '<p class="modal-empty-history">No recorded match history for this category yet.</p>';
    }

    const modalAvatarHTML = player.photo
      ? `<img src="${player.photo}" class="card-avatar-img" alt="${escapeHtml(player.username)}">`
      : `<span class="card-avatar-initial" style="font-size: 1.85rem;">${initial}</span>`;

    const content = `
      <div class="modal-player-detail">
        <!-- Hero Profile Info -->
        <div class="modal-player-hero">
          <div class="card-avatar modal-hero-avatar">
            ${modalAvatarHTML}
          </div>
          <div class="modal-hero-info">
            <h3 class="modal-hero-name">${escapeHtml(player.username)}</h3>
            <div class="modal-hero-id">${player.id}</div>
            <div class="card-tags-row" style="margin-top: 0.35rem;">
              <span class="card-meta-tag sport">${escapeHtml(sport)}</span>
              <span class="card-meta-tag category">${escapeHtml(category)}</span>
              <span class="card-meta-tag grade">${escapeHtml(player.gradeLevel || 'Varsity')}</span>
            </div>
          </div>
          <div class="card-rank-badge ${rankColorClass}" style="min-width: 52px; padding: 0.4rem 0.65rem;">
            <span class="rank-badge-label">RANK</span>
            <span class="rank-badge-num" style="font-size: 1.3rem;">${rankDisplayHTML}</span>
          </div>
        </div>

        <!-- 3-Metric Stats Grid -->
        <div class="card-stats" style="margin: 1.25rem 0 0.75rem;">
          <div class="card-stat">
            <div class="card-stat-value win-text">${wins}</div>
            <div class="card-stat-label">Wins</div>
          </div>
          <div class="card-stat">
            <div class="card-stat-value loss-text">${losses}</div>
            <div class="card-stat-label">Losses</div>
          </div>
          <div class="card-stat">
            <div class="card-stat-value winrate-val">${wr}%</div>
            <div class="card-stat-label">Winrate</div>
          </div>
        </div>

        <!-- Winrate Bar -->
        <div class="card-winrate-bar" style="margin-bottom: 1.25rem;">
          <div class="card-winrate-fill ${wrClass}" style="width: ${wr}%"></div>
        </div>

        <!-- Action Button -->
        <div style="display: flex; justify-content: center; margin-bottom: 1.25rem;">
          <button class="btn btn-primary btn-sm" onclick="Cards.downloadCard('${player.id}', '${escapeAttr(sport)}', '${escapeAttr(category)}')">
            Download Digital Card (PNG)
          </button>
        </div>

        <!-- History -->
        ${historyHTML}
      </div>
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
      ctx.fillText(player.gradeLevel || '', 400, 580);

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
