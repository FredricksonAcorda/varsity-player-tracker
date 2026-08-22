/**
 * events.js — Events & Tournaments Module
 * Renders event cards and match results.
 */

const Events = (() => {
  function init() {
    // Renders on tab switch
  }

  function render() {
    const events = Storage.getEvents();
    const emptyEl = document.getElementById('eventsEmpty');
    const listEl = document.getElementById('eventsList');

    if (events.length === 0) {
      emptyEl.style.display = '';
      listEl.innerHTML = '';
      return;
    }

    emptyEl.style.display = 'none';

    // Sort: ongoing first, then upcoming, then completed
    const sortOrder = { ongoing: 0, upcoming: 1, completed: 2 };
    const sorted = [...events].sort((a, b) => {
      const orderDiff = (sortOrder[a.status] || 0) - (sortOrder[b.status] || 0);
      if (orderDiff !== 0) return orderDiff;
      return new Date(b.date) - new Date(a.date);
    });

    listEl.innerHTML = sorted.map(event => {
      const matchCount = event.matches ? event.matches.length : 0;

      let matchesHTML = '';
      if (event.matches && event.matches.length > 0) {
        matchesHTML = `
          <div class="event-matches">
            <h4>Match Results (${matchCount})</h4>
            <div class="match-history-list">
              ${event.matches.slice().reverse().slice(0, 5).map(m => {
                const p1 = Storage.getPlayerById(m.player1);
                const p2 = Storage.getPlayerById(m.player2);
                const winner = Storage.getPlayerById(m.winner);
                const p1Name = p1 ? p1.username : m.player1;
                const p2Name = p2 ? p2.username : (m.player2 || 'Unknown');
                const winnerName = winner ? winner.username : 'Unknown';

                return `
                  <div class="match-history-item">
                    <span>${escapeHtml(p1Name)}</span>
                    <span style="color:var(--text-muted)">vs</span>
                    <span>${escapeHtml(p2Name)}</span>
                    <span class="match-result-badge win">Winner: ${escapeHtml(winnerName)}</span>
                    <span class="match-date">${m.date || ''}</span>
                  </div>
                `;
              }).join('')}
              ${matchCount > 5 ? `<p style="color:var(--text-muted); font-size:0.8rem; margin-top:0.5rem;">+ ${matchCount - 5} more matches</p>` : ''}
            </div>
          </div>
        `;
      }

      return `
        <div class="event-card">
          <div class="event-card-header">
            <div class="event-name">${escapeHtml(event.name)}</div>
            <span class="event-status ${event.status}">${event.status}</span>
          </div>
          <div class="event-meta">
            <span>${escapeHtml(event.sport)}</span>
            <span>${escapeHtml(event.category)}</span>
            <span>Date: ${event.date}</span>
            <span>${matchCount} Matches</span>
          </div>
          ${matchesHTML}
        </div>
      `;
    }).join('');
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
