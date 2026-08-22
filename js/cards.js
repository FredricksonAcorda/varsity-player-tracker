/**
 * cards.js — Player Cards Module
 * Renders the visual player cards grid with glassmorphism design.
 */

const Cards = (() => {
  function init() {
    // Renders on tab switch
  }

  function render() {
    const filters = App.getFilters();
    const rows = Storage.getFlatPlayerStats(filters);
    const grid = document.getElementById('cardsGrid');
    const emptyEl = document.getElementById('cardsEmpty');

    if (rows.length === 0) {
      grid.innerHTML = '';
      grid.appendChild(emptyEl);
      emptyEl.style.display = '';
      return;
    }

    emptyEl.style.display = 'none';

    // Group by player + sport to avoid duplicate cards for same player
    // But show separate cards per category
    grid.innerHTML = rows.map((row, idx) => {
      const emoji = Storage.getSportEmoji(row.sport);
      const rankTier = getRankTier(row.rank);
      const wrClass = row.winrate >= 60 ? 'high' : row.winrate >= 40 ? 'mid' : 'low';
      const initial = row.username.charAt(0).toUpperCase();
      const rankColorClass = row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : row.rank === 3 ? 'bronze' : 'default';

      let ribbonHTML = '';
      if (row.rank >= 1 && row.rank <= 3) {
        const ribbonClass = row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : 'bronze';
        const ribbonText = row.rank === 1 ? '1st' : row.rank === 2 ? '2nd' : '3rd';
        ribbonHTML = `<div class="card-rank-ribbon ${ribbonClass}">${ribbonText}</div>`;
      }

      return `
        <div class="player-card ${rankTier}" 
             style="animation-delay: ${idx * 0.08}s"
             onclick="Cards.showDetail('${row.id}', '${escapeAttr(row.sport)}', '${escapeAttr(row.category)}')">
          ${ribbonHTML}
          <div class="card-header">
            <div class="card-avatar">${initial}</div>
            <div class="card-rank-display">
              <div class="card-rank-label">Rank</div>
              <div class="card-rank-number ${rankColorClass}">${row.rank > 0 ? '#' + row.rank : '—'}</div>
            </div>
          </div>
          <div class="card-name">${escapeHtml(row.username)}</div>
          <div class="card-id">${row.id}</div>
          <div class="card-meta">
            <span class="card-meta-tag">${emoji} ${escapeHtml(row.sport)}</span>
            <span class="card-meta-tag">${escapeHtml(row.category)}</span>
            <span class="card-meta-tag">${escapeHtml(row.gradeLevel)}</span>
            ${row.section ? `<span class="card-meta-tag">${escapeHtml(row.section)}</span>` : ''}
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

  function getRankTier(rank) {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  }

  function showDetail(playerId, sport, category) {
    const player = Storage.getPlayerById(playerId);
    if (!player) return;

    const sportData = player.sports.find(s => s.sport === sport);
    if (!sportData) return;

    const catData = sportData.categories.find(c => c.category === category);
    if (!catData) return;

    const emoji = Storage.getSportEmoji(sport);
    const wr = Storage.getWinrate(catData.wins, catData.losses);
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
              <span class="match-date">${m.date}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      historyHTML = '<p style="color:var(--text-muted); font-size:0.85rem; margin-top:1rem;">No match history yet.</p>';
    }

    const content = `
      <div style="text-align:center; margin-bottom:1.5rem;">
        <div class="card-avatar" style="width:64px; height:64px; font-size:1.75rem; margin:0 auto 0.75rem;">
          ${player.username.charAt(0).toUpperCase()}
        </div>
        <div style="font-size:1.25rem; font-weight:700; font-family:var(--font-heading);">${escapeHtml(player.username)}</div>
        <div style="color:var(--accent-primary); font-size:0.8rem; letter-spacing:0.5px;">${player.id}</div>
        <div style="margin-top:0.5rem; display:flex; justify-content:center; gap:0.4rem; flex-wrap:wrap;">
          <span class="card-meta-tag">${emoji} ${escapeHtml(sport)}</span>
          <span class="card-meta-tag">${escapeHtml(category)}</span>
          <span class="card-meta-tag">${escapeHtml(player.gradeLevel)}</span>
          <span class="card-meta-tag">${player.gender}</span>
          ${player.section ? `<span class="card-meta-tag">${escapeHtml(player.section)}</span>` : ''}
        </div>
      </div>
      <div class="card-stats" style="max-width:300px; margin:0 auto 1rem;">
        <div class="card-stat">
          <div class="card-stat-value win-text">${catData.wins}</div>
          <div class="card-stat-label">Wins</div>
        </div>
        <div class="card-stat">
          <div class="card-stat-value loss-text">${catData.losses}</div>
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
          📥 Download Set Card (PNG)
        </button>
      </div>
      ${historyHTML}
    `;

    App.openModal(`${emoji} ${player.username} — ${category}`, content);
  }

  function downloadCard(playerId, sport, category) {
    const player = Storage.getPlayerById(playerId);
    if (!player) return;
    const sportData = player.sports.find(s => s.sport === sport);
    if (!sportData) return;
    const catData = sportData.categories.find(c => c.category === category);
    if (!catData) return;

    const emoji = Storage.getSportEmoji(sport);
    const wr = Storage.getWinrate(catData.wins, catData.losses);
    const total = catData.wins + catData.losses;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 1100;

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
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ OFFICIAL ATHLETE SET CARD ★', 400, 85);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('VARSITY SPORTS PERFORMANCE TRACKER', 400, 115);

    // Large Avatar circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(400, 240, 90, 0, Math.PI * 2);
    ctx.fillStyle = borderGrad;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Initial
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px Outfit, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.username.charAt(0).toUpperCase(), 400, 240);
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
    ctx.fillText(player.username.toUpperCase(), 400, 440);

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
    ctx.fillText(`${emoji} ${sport} — ${category}`, 400, 552);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px Inter, sans-serif';
    const secText = player.section ? ` • ${player.section}` : '';
    ctx.fillText(`${player.gradeLevel}${secText} • ${player.gender}`, 400, 580);

    // Stats Grid
    const statBoxY = 630;
    const statW = 190;
    const statH = 140;

    drawStatBox(ctx, 80, statBoxY, statW, statH, String(catData.wins), 'WINS', '#10b981');
    drawStatBox(ctx, 305, statBoxY, statW, statH, String(catData.losses), 'LOSSES', '#f43f5e');
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
    link.download = `${player.username.replace(/\s+/g, '_')}_${sport}_SetCard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    App.showToast('Digital Player Card downloaded! 🪪', 'success');
  }

  function drawStatBox(ctx, x, y, w, h, value, label, color) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = color;
    ctx.font = 'bold 44px Outfit, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(value, x + w / 2, y + 65);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText(label, x + w / 2, y + 105);
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
    showDetail,
    downloadCard,
  };
})();
