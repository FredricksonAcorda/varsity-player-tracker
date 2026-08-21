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
      ${historyHTML}
    `;

    App.openModal(`${emoji} ${player.username} — ${category}`, content);
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
  };
})();
