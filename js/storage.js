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

  // ─── Default Sports Config ───
  const DEFAULT_SPORTS = [
    {
      sport: 'Badminton',
      emoji: '🏸',
      categories: ["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"],
    },
    {
      sport: 'Basketball',
      emoji: '🏀',
      categories: ["Men's 3x3", "Women's 3x3", "Men's 5v5", "Women's 5v5"],
    },
    {
      sport: 'Volleyball',
      emoji: '🏐',
      categories: ["Men's", "Women's", "Mixed"],
    },
    {
      sport: 'Table Tennis',
      emoji: '🏓',
      categories: ["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"],
    },
    {
      sport: 'Football',
      emoji: '⚽',
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

  // ─── Initialization ───
  function init() {
    if (!get(KEYS.SPORTS_CONFIG)) {
      set(KEYS.SPORTS_CONFIG, DEFAULT_SPORTS);
    }
    if (!get(KEYS.ADMIN_PASSWORD)) {
      set(KEYS.ADMIN_PASSWORD, simpleHash(DEFAULT_ADMIN_PASSWORD));
    }
    if (!get(KEYS.PLAYERS)) {
      set(KEYS.PLAYERS, []);
    }
    if (!get(KEYS.EVENTS)) {
      set(KEYS.EVENTS, []);
    }
    if (!get(KEYS.ID_COUNTER)) {
      set(KEYS.ID_COUNTER, 0);
    }
    if (!get(KEYS.EVENT_COUNTER)) {
      set(KEYS.EVENT_COUNTER, 0);
    }
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
      section: playerData.section,
      gender: playerData.gender,
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

  // ─── Player Stats ───
  function recordMatch(playerId, sport, category, result, opponent = '', eventName = '') {
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return false;

    const sportData = player.sports.find(s => s.sport === sport);
    if (!sportData) return false;

    const catData = sportData.categories.find(c => c.category === category);
    if (!catData) return false;

    if (result === 'W') {
      catData.wins++;
    } else if (result === 'L') {
      catData.losses++;
    }

    catData.matchHistory.push({
      date: new Date().toISOString().split('T')[0],
      result,
      opponent,
      event: eventName,
    });

    set(KEYS.PLAYERS, players);
    return true;
  }

  function setPlayerRank(playerId, sport, category, rank) {
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return false;

    const sportData = player.sports.find(s => s.sport === sport);
    if (!sportData) return false;

    const catData = sportData.categories.find(c => c.category === category);
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

  // ─── Flatten players for leaderboard (one row per sport-category) ───
  function getFlatPlayerStats(filters = {}) {
    const players = getPlayers();
    const rows = [];

    players.forEach(player => {
      player.sports.forEach(sportData => {
        sportData.categories.forEach(catData => {
          const row = {
            id: player.id,
            username: player.username,
            gradeLevel: player.gradeLevel,
            section: player.section,
            gender: player.gender,
            sport: sportData.sport,
            category: catData.category,
            wins: catData.wins,
            losses: catData.losses,
            winrate: getWinrate(catData.wins, catData.losses),
            rank: catData.rank,
            matchHistory: catData.matchHistory,
          };

          // Apply filters
          if (filters.sport && filters.sport !== 'All' && row.sport !== filters.sport) return;
          if (filters.category && filters.category !== 'All' && row.category !== filters.category) return;
          if (filters.gradeLevel && filters.gradeLevel !== 'All' && row.gradeLevel !== filters.gradeLevel) return;
          if (filters.gender && filters.gender !== 'All' && row.gender !== filters.gender) return;
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            if (!row.username.toLowerCase().includes(searchLower) && !row.id.toLowerCase().includes(searchLower)) return;
          }

          rows.push(row);
        });
      });
    });

    // Sort by rank (ranked first, then unranked)
    rows.sort((a, b) => {
      if (a.rank === 0 && b.rank === 0) return b.winrate - a.winrate;
      if (a.rank === 0) return 1;
      if (b.rank === 0) return -1;
      return a.rank - b.rank;
    });

    return rows;
  }

  // ─── Events CRUD ───
  function getEvents() {
    return get(KEYS.EVENTS) || [];
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
      sport: eventData.sport,
      category: eventData.category,
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
    const config = getSportsConfig();
    const sport = config.find(s => s.sport === sportName);
    return sport ? sport.emoji : '🏅';
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
    const player = getPlayerByUsername(username);
    if (!player) return null;
    if (player.passwordHash !== simpleHash(password)) return null;
    return player;
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
    // Stats
    recordMatch,
    setPlayerRank,
    getWinrate,
    getFlatPlayerStats,
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
