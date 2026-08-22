# Varsity Player Tracker

A web-based sports performance and digital player card tracker designed for school varsity teams, tournaments, and intramurals. 

This app solves the problem of players not having "set cards" by giving every athlete a digital profile showing their rank, winrate, and match history across different sports and categories.

## Features

- **Leaderboard**: Ranked table of all players sorted by rank and winrate. Includes a full filter system (Sport, Category, Grade, Search).
- **Digital Player Cards**: Visual player profiles featuring glassmorphism design and rank-specific ribbons (Gold/Silver/Bronze). Click to view detailed match history and export HD Canvas Set Cards. Includes sorting and Grid/List layout toggle.
- **Player Profiles**: Registration system generating unique sport-based Player IDs (e.g., `BDMN-00001`). Players can log in to view their stats, upload their photo, and manage their profile.
- **Events Management**: Track upcoming, ongoing, and completed tournaments, complete with match history and results.
- **Admin Panel**: Password-protected area to manage rosters, record match results, set player ranks, create events, and configure available sports.
- **Local Storage**: Fully functional single-page application (SPA) using browser `localStorage` for data persistence. Includes data Export/Import functionality for backups.

## Technology Stack

- **Pure HTML, CSS, JavaScript** — Clean, performant vanilla web technologies without heavyweight dependencies.
- **Responsive Design & PillNav Component** — Custom CSS featuring a premium dark theme, floating sliding pill navigation, and fluid animations. Designed mobile-first.

## How to Run

Because this app uses `localStorage` and plain web technologies, running it is simple:

1. Clone or download this repository.
2. Open the `index.html` file in any modern web browser.
3. *Alternatively*, deploy it instantly using services like **Vercel**, **Netlify**, or **GitHub Pages**.

## Admin Access

- The Admin Panel is password-protected to ensure only organizers and coaches can manage tournaments, update records, and adjust player rankings.
- Default admin password: `admin123`

## Sports and Categories

The app supports multiple sports by default, and admins can easily add more:

- **Badminton**: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles
- **Basketball**: Men's 3x3, Women's 3x3, Men's 5v5, Women's 5v5
- **Volleyball**: Men's, Women's, Mixed
- **Table Tennis**: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles
- **Football**: Men's, Women's, Mixed

## Storage

Data is stored in the browser's `localStorage`. To move data between devices or create backups, use the **Export/Import** feature found in the Admin panel settings.
