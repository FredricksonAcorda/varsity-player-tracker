/**
 * events.js — Events & Tournaments Module
 * Renders multi-sport event cards and match results.
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

      const sportsHTML = (event.sports || []).map(s => {
        const catPills = (s.categories || []).map(c => `<span class="event-cat-pill">${escapeHtml(c)}</span>`).join('');
        return `
          <div class="event-sport-row">
            <span class="event-sport-title">${escapeHtml(s.sport)}</span>
            <div class="event-cat-pills">${catPills || '<span style="color:var(--text-muted); font-size:0.75rem;">Open</span>'}</div>
          </div>
        `;
      }).join('');

      let matchesHTML = '';
      if (event.matches && event.matches.length > 0) {
        matchesHTML = `
          <div class="event-matches">
            <h4>Match Results (${matchCount})</h4>
            <div class="match-history-list">
              ${event.matches.slice().reverse().slice(0, 8).map(m => {
                const p1 = Storage.getPlayerById(m.player1);
                const p2 = Storage.getPlayerById(m.player2);
                const winner = Storage.getPlayerById(m.winner);
                const p1Name = p1 ? p1.username : m.player1;
                const p2Name = p2 ? p2.username : (m.player2 || 'Unknown');
                const winnerName = winner ? winner.username : 'Unknown';
                const sportCatTag = m.sport ? `${m.sport}${m.category ? ' • ' + m.category : ''}` : '';

                return `
                  <div class="match-history-item">
                    <div style="display:flex; flex-direction:column; gap:0.25rem;">
                      <div>
                        <strong>${escapeHtml(p1Name)}</strong>
                        <span style="color:var(--text-muted); margin:0 0.35rem;">vs</span>
                        <strong>${escapeHtml(p2Name)}</strong>
                      </div>
                      ${sportCatTag ? `<span class="event-match-sport-tag">${escapeHtml(sportCatTag)}</span>` : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                      <span class="match-result-badge win">Winner: ${escapeHtml(winnerName)}</span>
                      <span class="match-date">${m.date || ''}</span>
                    </div>
                  </div>
                `;
              }).join('')}
              ${matchCount > 8 ? `<p style="color:var(--text-muted); font-size:0.8rem; margin-top:0.5rem;">+ ${matchCount - 8} more matches</p>` : ''}
            </div>
          </div>
        `;
      }

      return `
        <div class="event-card">
          <div class="event-card-header">
            <div>
              <div class="event-name">${escapeHtml(event.name)}</div>
              <div class="event-date-meta">Date: ${event.date} • ${matchCount} Matches</div>
            </div>
            <span class="event-status ${event.status}">${event.status}</span>
          </div>

          <div class="event-sports-container">
            ${sportsHTML || '<p style="color:var(--text-muted); font-size:0.8rem;">All Sports</p>'}
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
