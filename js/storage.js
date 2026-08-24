/**
 * storage.js — Data Layer for Varsity Sports Player Tracker
 * Handles all localStorage CRUD operations, data models, and utilities.
 */

const Storage = (() => {
  // ─── Keys ───
  const KEYS = {
    PLAYERS: 'varsity_players',
    EVENTS: 'varsity_events',
    SPORTS_CONFIG: 'varsity_sports_config',
    ADMIN_PASSWORD: 'varsity_admin_password',
    SESSION: 'varsity_current_session',
    ID_COUNTER: 'varsity_id_counter',
    EVENT_COUNTER: 'varsity_event_counter',
  };

  // ─── Default Sports Config (Clean Typographic) ───
  const DEFAULT_SPORTS = [
    {
      sport: 'Badminton',
      categories: ["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"],
    },
    {
      sport: 'Basketball',
      categories: ["Men's 3x3", "Women's 3x3", "Men's 5v5", "Women's 5v5"],
    },
    {
      sport: 'Volleyball',
      categories: ["Men's", "Women's", "Mixed"],
    },
    {
      sport: 'Table Tennis',
      categories: ["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"],
    },
    {
      sport: 'Football',
      categories: ["Men's", "Women's", "Mixed"],
    },
  ];

  const DEFAULT_ADMIN_PASSWORD = 'admin123';

  const GRADE_LEVELS = [
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12',
    'College Year 1', 'College Year 2', 'College Year 3', 'College Year 4',
  ];

  // ─── Simple Hash (for school project, not production) ───
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  // ─── Generic localStorage helpers ───
  function get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key}:`, e);
    }
  }

  // ─── Default Demo Players ───
  const DEFAULT_PLAYERS = [
    {
      id: 'BDMN-00001',
      username: 'Alex Rivera',
      passwordHash: simpleHash('Password123!'),
      gradeLevel: 'Grade 11',
      section: 'Section 1A',
      photo: '',
      sports: [
        {
          sport: 'Badminton',
          categories: [
            {
              category: "Men's Singles",
              wins: 8,
              losses: 2,
              rank: 1,
              matchHistory: [
                { date: '2026-08-15', result: 'W', opponent: 'Sam Cruz', event: 'Varsity Tryouts' },
                { date: '2026-08-18', result: 'W', opponent: 'Chris Tan', event: 'District Prelims' }
              ]
            }
          ]
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'BDMN-00002',
      username: 'Sam Cruz',
      passwordHash: simpleHash('Password123!'),
      gradeLevel: 'Grade 12',
      section: 'Section 2B',
      photo: '',
      sports: [
        {
          sport: 'Badminton',
          categories: [
            {
              category: "Men's Singles",
              wins: 6,
              losses: 3,
              rank: 2,
              matchHistory: [
                { date: '2026-08-15', result: 'L', opponent: 'Alex Rivera', event: 'Varsity Tryouts' }
              ]
            }
          ]
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'BSKT-00001',
      username: 'Jordan Hayes',
      passwordHash: simpleHash('Password123!'),
      gradeLevel: 'College Year 2',
      section: 'Team Blue',
      photo: '',
      sports: [
        {
          sport: 'Basketball',
          categories: [
            {
              category: "Men's 5v5",
              wins: 11,
              losses: 1,
              rank: 1,
              matchHistory: [
                { date: '2026-08-10', result: 'W', opponent: 'Titans', event: 'Inter-College Cup' },
                { date: '2026-08-14', result: 'W', opponent: 'Hawks', event: 'Semi-Finals' }
              ]
            }
          ]
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'VLBL-00001',
      username: 'Elena Vance',
      passwordHash: simpleHash('Password123!'),
      gradeLevel: 'Grade 12',
      section: 'Spikers A',
      photo: '',
      sports: [
        {
          sport: 'Volleyball',
          categories: [
            {
              category: "Women's",
              wins: 9,
              losses: 2,
              rank: 1,
              matchHistory: [
                { date: '2026-08-12', result: 'W', opponent: 'St. Jude', event: 'Invitational 2026' }
              ]
            }
          ]
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  // ─── Initialization ───
  function init() {
    if (!get(KEYS.SPORTS_CONFIG)) {
      set(KEYS.SPORTS_CONFIG, DEFAULT_SPORTS);
    }
    if (!get(KEYS.ADMIN_PASSWORD)) {
      set(KEYS.ADMIN_PASSWORD, simpleHash(DEFAULT_ADMIN_PASSWORD));
    }
    const existingPlayers = get(KEYS.PLAYERS);
    if (!existingPlayers || existingPlayers.length === 0) {
      set(KEYS.PLAYERS, DEFAULT_PLAYERS);
      set('varsity_id_counter_BDMN', 2);
      set('varsity_id_counter_BSKT', 1);
      set('varsity_id_counter_VLBL', 1);
    }
    const existingEvents = get(KEYS.EVENTS);
    if (!existingEvents || existingEvents.length === 0) {
      const defaultEvents = [
        {
          id: 'EVT-001',
          name: 'Inter-School Varsity Championship 2026',
          date: '2026-09-15',
          status: 'ongoing',
          sports: [
            { sport: 'Badminton', categories: ["Men's Singles", "Women's Singles", "Mixed Doubles"] },
            { sport: 'Basketball', categories: ["Men's 5v5", "Women's 5v5"] },
            { sport: 'Volleyball', categories: ["Men's", "Women's"] }
          ],
          matches: [
            { sport: 'Badminton', category: "Men's Singles", player1: 'BDMN-00001', player2: 'BDMN-00002', winner: 'BDMN-00001', date: '2026-08-15' }
          ],
          createdAt: new Date().toISOString(),
        }
      ];
      set(KEYS.EVENTS, defaultEvents);
      set(KEYS.EVENT_COUNTER, 1);
    }
    if (!get(KEYS.ID_COUNTER)) {
      set(KEYS.ID_COUNTER, 0);
    }
    if (!get(KEYS.EVENT_COUNTER)) {
      set(KEYS.EVENT_COUNTER, 1);
    }
    // Auto-calculate ranks for initial seed roster
    recalculateAllRanks();
  }

  // ─── Sport Prefix Mapping ───
  const SPORT_PREFIXES = {
    'Badminton': 'BDMN',
    'Basketball': 'BSKT',
    'Volleyball': 'VLBL',
    'Table Tennis': 'TBTN',
    'Football': 'FTBL',
  };

  function getSportPrefix(sportName) {
    if (SPORT_PREFIXES[sportName]) return SPORT_PREFIXES[sportName];
    // For custom sports, take first 4 consonants/letters uppercase
    const cleaned = sportName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return cleaned.substring(0, 4) || 'PLYR';
  }

  // ─── Player ID Generation (sport-based) ───
  function generatePlayerId(sportName) {
    // Each sport has its own counter key
    const prefix = getSportPrefix(sportName);
    const counterKey = `varsity_id_counter_${prefix}`;
    let counter = get(counterKey) || 0;
    counter++;
    set(counterKey, counter);
    return prefix + '-' + String(counter).padStart(5, '0');
  }

  function generateEventId() {
    let counter = get(KEYS.EVENT_COUNTER) || 0;
    counter++;
    set(KEYS.EVENT_COUNTER, counter);
    return 'EVT-' + String(counter).padStart(3, '0');
  }

  // ─── Players CRUD ───
  function getPlayers() {
    return get(KEYS.PLAYERS) || [];
  }

  function getPlayerById(id) {
    const players = getPlayers();
    return players.find(p => p.id === id) || null;
  }

  function getPlayerByUsername(username) {
    const players = getPlayers();
    return players.find(p => p.username.toLowerCase() === username.toLowerCase()) || null;
  }

  function addPlayer(playerData) {
    const players = getPlayers();
    // Use the first sport for the ID prefix
    const sportName = (playerData.sports && playerData.sports.length > 0) ? playerData.sports[0].sport : '';
    const id = generatePlayerId(sportName);

    const newPlayer = {
      id,
      username: playerData.username,
      passwordHash: simpleHash(playerData.password),
      gradeLevel: playerData.gradeLevel,
      section: playerData.section || '',
      photo: playerData.photo || '',
      sports: playerData.sports || [], // [{ sport, categories: [{ category, wins, losses, rank, matchHistory }] }]
      createdAt: new Date().toISOString(),
    };

    // Initialize stats for each sport/category
    newPlayer.sports = newPlayer.sports.map(s => ({
      sport: s.sport,
      categories: s.categories.map(cat => ({
        category: typeof cat === 'string' ? cat : cat.category,
        wins: 0,
        losses: 0,
        rank: 0,
        matchHistory: [],
      })),
    }));

    players.push(newPlayer);
    set(KEYS.PLAYERS, players);
    return newPlayer;
  }

  function updatePlayer(id, updates) {
    const players = getPlayers();
    const index = players.findIndex(p => p.id === id);
    if (index === -1) return null;

    players[index] = { ...players[index], ...updates };
    set(KEYS.PLAYERS, players);
    return players[index];
  }

  function deletePlayer(id) {
    const players = getPlayers();
    const filtered = players.filter(p => p.id !== id);
    set(KEYS.PLAYERS, filtered);
    return filtered.length < players.length;
  }

  // ─── Automatic Ranking Recalculation Engine ───
  function recalculateRanksForCategory(sport, category) {
    const players = getPlayers();
    const activePlayers = [];

    players.forEach(p => {
      const sportData = (p.sports || []).find(s => s.sport === sport);
      if (!sportData) return;
      const catData = (sportData.categories || []).find(c => (c.category || c) === category);
      if (!catData) return;

      const wins = catData.wins || 0;
      const losses = catData.losses || 0;
      const totalMatches = wins + losses;
      const winrate = getWinrate(wins, losses);

      if (totalMatches > 0) {
        activePlayers.push({ player: p, catData, wins, losses, winrate, totalMatches });
      } else {
        // Player has no matches played yet: STRICTLY UNRANKED (rank = 0)
        catData.rank = 0;
      }
    });

    // Rank algorithm for active players with at least 1 recorded match:
    // 1. Highest total wins
    // 2. Highest winrate percentage
    // 3. Lowest losses
    // 4. Alphabetical tie-breaker
    activePlayers.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winrate !== a.winrate) return b.winrate - a.winrate;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return (a.player.username || '').localeCompare(b.player.username || '');
    });

    activePlayers.forEach((item, index) => {
      item.catData.rank = index + 1;
    });

    set(KEYS.PLAYERS, players);
  }

  function recalculateAllRanks() {
    const sportsConfig = getSportsConfig();
    sportsConfig.forEach(s => {
      (s.categories || []).forEach(cat => {
        const catName = typeof cat === 'string' ? cat : cat.category;
        recalculateRanksForCategory(s.sport, catName);
      });
    });
  }

  // ─── Summary Stats (for Homepage Ticker) ───
  function getSummaryStats() {
    const players = getPlayers();
    const sports = getSportsConfig();
    const events = getEvents();

    let totalMatches = 0;
    let topWinrate = 0;
    let totalWins = 0;

    players.forEach(p => {
      (p.sports || []).forEach(s => {
        (s.categories || []).forEach(c => {
          const w = c.wins || 0;
          const l = c.losses || 0;
          totalMatches += (c.matchHistory ? c.matchHistory.length : 0);
          totalWins += w;
          const wr = getWinrate(w, l);
          if (wr > topWinrate && (w + l) >= 2) {
            topWinrate = wr;
          }
        });
      });
    });

    events.forEach(e => {
      totalMatches += (e.matches ? e.matches.length : 0);
    });

    return {
      athleteCount: players.length,
      sportCount: sports.length,
      eventCount: events.length,
      matchCount: Math.max(totalMatches, totalWins),
      topWinrate: topWinrate || 80,
    };
  }

  // ─── Player Stats ───
  function recordMatch(playerId, sport, category, result, opponent = '', eventName = '') {
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return false;

    const sportData = player.sports.find(s => s.sport === sport);
    if (!sportData) return false;

    const catData = sportData.categories.find(c => (c.category || c) === category);
    if (!catData) return false;

    if (result === 'W') {
      catData.wins = (catData.wins || 0) + 1;
    } else if (result === 'L') {
      catData.losses = (catData.losses || 0) + 1;
    }

    catData.matchHistory = catData.matchHistory || [];
    catData.matchHistory.push({
      date: new Date().toISOString().split('T')[0],
      result,
      opponent,
      event: eventName,
    });

    set(KEYS.PLAYERS, players);
    // Automatically recalculate ranks for this sport/category!
    recalculateRanksForCategory(sport, category);
    return true;
  }

  function setPlayerRank(playerId, sport, category, rank) {
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return false;

    const sportData = player.sports.find(s => s.sport === sport);
    if (!sportData) return false;

    const catData = sportData.categories.find(c => (c.category || c) === category);
    if (!catData) return false;

    catData.rank = rank;
    set(KEYS.PLAYERS, players);
    return true;
  }

  function getWinrate(wins, losses) {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  }

  // ─── Add sport/category to existing player ───
  function addSportToPlayer(playerId, sport, categories) {
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return false;

    let sportData = player.sports.find(s => s.sport === sport);
    if (!sportData) {
      sportData = { sport, categories: [] };
      player.sports.push(sportData);
    }

    categories.forEach(cat => {
      if (!sportData.categories.find(c => c.category === cat)) {
        sportData.categories.push({
          category: cat,
          wins: 0,
          losses: 0,
          rank: 0,
          matchHistory: [],
        });
      }
    });

    set(KEYS.PLAYERS, players);
    return true;
  }

  function removeCategoryFromPlayer(playerId, sport, category) {
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return false;

    const sportData = player.sports.find(s => s.sport === sport);
    if (!sportData) return false;

    sportData.categories = sportData.categories.filter(c => c.category !== category);
    if (sportData.categories.length === 0) {
      player.sports = player.sports.filter(s => s.sport !== sport);
    }

    set(KEYS.PLAYERS, players);
    return true;
  }

  // ─── Flatten players for leaderboard (one row per sport-category) ───
  function getFlatPlayerStats(filters = {}) {
    const players = getPlayers();
    const rows = [];

    players.forEach(player => {
      (player.sports || []).forEach(sportData => {
        (sportData.categories || []).forEach(catItem => {
          const categoryName = typeof catItem === 'string' ? catItem : catItem.category;
          const wins = (typeof catItem === 'object' && catItem.wins) ? catItem.wins : 0;
          const losses = (typeof catItem === 'object' && catItem.losses) ? catItem.losses : 0;
          const rank = (typeof catItem === 'object' && catItem.rank) ? catItem.rank : 0;
          const matchHistory = (typeof catItem === 'object' && catItem.matchHistory) ? catItem.matchHistory : [];

          const row = {
            id: player.id,
            username: player.username,
            photo: player.photo || '',
            gradeLevel: player.gradeLevel || '',
            section: player.section || '',
            sport: sportData.sport,
            category: categoryName,
            wins,
            losses,
            winrate: getWinrate(wins, losses),
            rank,
            matchHistory,
          };

          // Apply filters
          if (filters.sport && filters.sport !== 'All' && row.sport !== filters.sport) return;
          if (filters.category && filters.category !== 'All' && row.category !== filters.category) return;
          
          const gradeFilter = filters.grade || filters.gradeLevel;
          if (gradeFilter && gradeFilter !== 'All' && row.gradeLevel !== gradeFilter) return;

          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            if (!row.username.toLowerCase().includes(searchLower) && !row.id.toLowerCase().includes(searchLower)) return;
          }

          rows.push(row);
        });
      });
    });

    // Sort: Ranked active players first (#1, #2, #3...), then Unranked (rank = 0) at the bottom
    rows.sort((a, b) => {
      const aRanked = a.rank > 0 && (a.wins + a.losses > 0);
      const bRanked = b.rank > 0 && (b.wins + b.losses > 0);

      if (aRanked && bRanked) return a.rank - b.rank;
      if (aRanked && !bRanked) return -1;
      if (!aRanked && bRanked) return 1;

      // Both unranked: sort by wins -> winrate -> name
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winrate !== a.winrate) return b.winrate - a.winrate;
      return (a.username || '').localeCompare(b.username || '');
    });

    return rows;
  }

  // ─── Events CRUD ───
  function getEvents() {
    const events = get(KEYS.EVENTS) || [];
    return events.map(e => {
      if (!e.sports || e.sports.length === 0) {
        if (e.sport && e.category) {
          e.sports = [{ sport: e.sport, categories: [e.category] }];
        } else if (e.sport) {
          e.sports = [{ sport: e.sport, categories: [] }];
        } else {
          e.sports = [];
        }
      }
      return e;
    });
  }

  function getEventById(id) {
    const events = getEvents();
    return events.find(e => e.id === id) || null;
  }

  function addEvent(eventData) {
    const events = getEvents();
    const newEvent = {
      id: generateEventId(),
      name: eventData.name,
      sports: eventData.sports || [], // [{ sport: "Badminton", categories: [...] }]
      date: eventData.date,
      status: eventData.status || 'upcoming',
      matches: [],
      createdAt: new Date().toISOString(),
    };
    events.push(newEvent);
    set(KEYS.EVENTS, events);
    return newEvent;
  }

  function updateEvent(id, updates) {
    const events = getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return null;
    events[index] = { ...events[index], ...updates };
    set(KEYS.EVENTS, events);
    return events[index];
  }

  function deleteEvent(id) {
    const events = getEvents();
    const filtered = events.filter(e => e.id !== id);
    set(KEYS.EVENTS, filtered);
    return filtered.length < events.length;
  }

  function addMatchToEvent(eventId, matchData) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return false;
    if (!event.matches) event.matches = [];
    event.matches.push({
      ...matchData,
      date: new Date().toISOString().split('T')[0],
    });
    set(KEYS.EVENTS, events);
    return true;
  }

  // ─── Sports Config ───
  function getSportsConfig() {
    return get(KEYS.SPORTS_CONFIG) || DEFAULT_SPORTS;
  }

  function updateSportsConfig(config) {
    set(KEYS.SPORTS_CONFIG, config);
  }

  function getSportEmoji(sportName) {
    return '';
  }

  function getCategoriesForSport(sportName) {
    const config = getSportsConfig();
    const sport = config.find(s => s.sport === sportName);
    return sport ? sport.categories : [];
  }

  // ─── Admin Password ───
  function verifyAdminPassword(password) {
    const storedHash = get(KEYS.ADMIN_PASSWORD);
    return storedHash === simpleHash(password);
  }

  function changeAdminPassword(newPassword) {
    set(KEYS.ADMIN_PASSWORD, simpleHash(newPassword));
  }

  // ─── Session ───
  function login(playerId) {
    set(KEYS.SESSION, { playerId, loggedInAt: new Date().toISOString() });
  }

  function logout() {
    localStorage.removeItem(KEYS.SESSION);
  }

  function getSession() {
    return get(KEYS.SESSION);
  }

  function getCurrentPlayer() {
    const session = getSession();
    if (!session) return null;
    return getPlayerById(session.playerId);
  }

  // ─── Auth ───
  function authenticate(username, password) {
    if (!username || !password) return null;
    const player = getPlayerByUsername(username.trim());
    if (!player) return null;
    const cleanPw = String(password).trim();
    const hash1 = simpleHash(password);
    const hash2 = simpleHash(cleanPw);
    if (player.passwordHash === hash1 || player.passwordHash === hash2 || player.password === password || player.password === cleanPw) {
      return player;
    }
    return null;
  }

  // ─── Export / Import ───
  function exportData() {
    return {
      players: get(KEYS.PLAYERS),
      events: get(KEYS.EVENTS),
      sportsConfig: get(KEYS.SPORTS_CONFIG),
      idCounter: get(KEYS.ID_COUNTER),
      eventCounter: get(KEYS.EVENT_COUNTER),
      exportedAt: new Date().toISOString(),
    };
  }

  function importData(data) {
    if (data.players) set(KEYS.PLAYERS, data.players);
    if (data.events) set(KEYS.EVENTS, data.events);
    if (data.sportsConfig) set(KEYS.SPORTS_CONFIG, data.sportsConfig);
    if (data.idCounter) set(KEYS.ID_COUNTER, data.idCounter);
    if (data.eventCounter) set(KEYS.EVENT_COUNTER, data.eventCounter);
    return true;
  }

  // ─── Grade Levels ───
  function getGradeLevels() {
    return GRADE_LEVELS;
  }

  // ─── Public API ───
  return {
    init,
    // Players
    getPlayers,
    getPlayerById,
    getPlayerByUsername,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addSportToPlayer,
    removeCategoryFromPlayer,
    // Stats & Rankings Engine
    recordMatch,
    setPlayerRank,
    recalculateRanksForCategory,
    recalculateAllRanks,
    getWinrate,
    getFlatPlayerStats,
    getSummaryStats,
    // Events
    getEvents,
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent,
    addMatchToEvent,
    // Sports Config
    getSportsConfig,
    updateSportsConfig,
    getSportEmoji,
    getCategoriesForSport,
    // Admin
    verifyAdminPassword,
    changeAdminPassword,
    // Session / Auth
    login,
    logout,
    getSession,
    getCurrentPlayer,
    authenticate,
    // Export / Import
    exportData,
    importData,
    // Utils
    getGradeLevels,
    generatePlayerId,
  };
})();
