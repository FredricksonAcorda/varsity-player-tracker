/**
 * home.js — Homepage & Varsity Landing Module (Clean Typographic Edition)
 * Manages live stat tickers, athlete spotlight previews, and FAQ accordions.
 */

const Home = (() => {
  function init() {
    setupFaqAccordion();
  }

  function render() {
    renderStatsTicker();
    renderAthleteSpotlight();
  }

  function renderStatsTicker() {
    const stats = Storage.getSummaryStats();
    const athletesEl = document.getElementById('homeStatAthletes');
    const sportsEl = document.getElementById('homeStatSports');
    const eventsEl = document.getElementById('homeStatEvents');
    const winrateEl = document.getElementById('homeStatWinrate');

    if (athletesEl) athletesEl.textContent = stats.athleteCount;
    if (sportsEl) sportsEl.textContent = stats.sportCount;
    if (eventsEl) eventsEl.textContent = stats.eventCount;
    if (winrateEl) winrateEl.textContent = stats.topWinrate;
  }

  function renderAthleteSpotlight() {
    const container = document.getElementById('homeSpotlightGrid');
    if (!container) return;

    // Get flat stats for all players
    const rows = Storage.getFlatPlayerStats({ sport: 'All', category: 'All', grade: 'All', search: '' });
    
    // Sort to get top 3 active athletes with recorded wins
    const topAthletes = [...rows].filter(r => (r.wins + r.losses) > 0).sort((a, b) => {
      if (a.rank > 0 && b.rank > 0) return a.rank - b.rank;
      if (a.rank > 0) return -1;
      if (b.rank > 0) return 1;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winrate - a.winrate;
    }).slice(0, 3);

    if (topAthletes.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; margin: 1rem auto; padding: 2.5rem 1.5rem;">
          <span class="empty-state-tag">SPOTLIGHT</span>
          <h3>Athlete Roster Warming Up</h3>
          <p>Register as an athlete or record tournament matches to appear in the spotlight.</p>
          <button class="btn btn-primary btn-sm" onclick="App.switchTab('profile')">Register as Athlete</button>
        </div>
      `;
      return;
    }

    container.innerHTML = topAthletes.map((row, idx) => {
      const isRanked = row.rank > 0;
      const rank = row.rank || (idx + 1);
      const tierClass = isRanked ? (rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : 'default') : 'default';
      const medal = isRanked ? `RANK #${rank}` : 'UNRANKED';
      const initial = row.username ? row.username.charAt(0).toUpperCase() : 'P';
      
      const avatarHTML = row.photo
        ? `<img src="${row.photo}" class="spotlight-avatar-img" alt="${escapeHtml(row.username)}">`
        : `<span class="spotlight-avatar-initial">${initial}</span>`;

      return `
        <div class="spotlight-card ${tierClass}" onclick="App.switchTab('cards')">
          <div class="spotlight-badge ${tierClass}">${medal}</div>
          <div class="spotlight-avatar">${avatarHTML}</div>
          <div class="spotlight-name">${escapeHtml(row.username)}</div>
          <div class="spotlight-id">${row.id}</div>
          
          <div class="spotlight-meta">
            <span class="card-meta-tag">${escapeHtml(row.sport)}</span>
            <span class="card-meta-tag">${escapeHtml(row.category)}</span>
          </div>

          <div class="spotlight-stats">
            <div class="spotlight-stat-item">
              <span class="spotlight-stat-val win-text">${row.wins}</span>
              <span class="spotlight-stat-lbl">Wins</span>
            </div>
            <div class="spotlight-stat-item">
              <span class="spotlight-stat-val loss-text">${row.losses}</span>
              <span class="spotlight-stat-lbl">Losses</span>
            </div>
            <div class="spotlight-stat-item">
              <span class="spotlight-stat-val highlight">${row.winrate}%</span>
              <span class="spotlight-stat-lbl">Winrate</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setupFaqAccordion() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const header = item.querySelector('.faq-header');
      if (header) {
        header.addEventListener('click', () => {
          const isOpen = item.classList.contains('active');
          document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
          if (!isOpen) {
            item.classList.add('active');
          }
        });
      }
    });
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
