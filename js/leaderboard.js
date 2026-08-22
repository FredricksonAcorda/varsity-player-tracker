/**
 * leaderboard.js — Leaderboard Module
 * Renders the ranked player table with filtering support.
 */

const Leaderboard = (() => {
  function init() {
    // Initial render happens when tab is switched
  }

  function render() {
    const filters = App.getFilters();
    const rows = Storage.getFlatPlayerStats(filters);

    const tableEl = document.getElementById('leaderboardTable');
    const emptyEl = document.getElementById('leaderboardEmpty');
    const bodyEl = document.getElementById('leaderboardBody');

    if (rows.length === 0) {
      tableEl.style.display = 'none';
      emptyEl.style.display = '';
      return;
    }

    tableEl.style.display = '';
    emptyEl.style.display = 'none';

    bodyEl.innerHTML = rows.map((row, idx) => {
      const rankDisplay = row.rank > 0 ? row.rank : '—';
      const rankClass = getRankClass(row.rank);

      const avatarHTML = row.photo
        ? `<img src="${row.photo}" class="table-avatar-img" alt="${escapeHtml(row.username)}">`
        : `<div class="table-avatar-initial">${row.username ? row.username.charAt(0).toUpperCase() : 'P'}</div>`;

      return `
        <tr class="count-up" style="animation-delay: ${idx * 0.05}s">
          <td>
            <span class="rank-badge ${rankClass}">${rankDisplay}</span>
          </td>
          <td>
            <div class="player-table-info">
              ${avatarHTML}
              <div>
                <div class="player-table-name">${escapeHtml(row.username)}</div>
                <div class="player-table-id">${row.id}</div>
              </div>
            </div>
          </td>
          <td><span class="sport-tag">${escapeHtml(row.sport)}</span></td>
          <td><span class="sport-tag">${escapeHtml(row.category)}</span></td>
          <td><span style="color: var(--text-secondary); font-size: 0.8rem;">${escapeHtml(row.gradeLevel)}</span></td>
          <td><span style="color: var(--text-secondary); font-size: 0.8rem;">${escapeHtml(row.section || '—')}</span></td>
        </tr>
      `;
    }).join('');
  }

  function getRankClass(rank) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    if (rank > 0) return 'rank-other';
    return 'rank-none';
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  return {
    init,
    render,
  };
})();
