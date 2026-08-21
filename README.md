# Varsity Player Tracker

A web-based sports performance and digital player card tracker designed for school varsity teams, tournaments, and intramurals. 

This app solves the problem of players not having "set cards" by giving every athlete a digital profile showing their rank, winrate, and match history across different sports and categories.

## 🌟 Features

- **🏆 Leaderboard**: Ranked table of all players sorted by rank and winrate. Includes a full filter system (Sport, Category, Grade, Gender, Search).
- **🪪 Digital Player Cards**: Visual player profiles featuring glassmorphism design and rank-specific ribbons (Gold/Silver/Bronze). Click to view detailed match history.
- **👤 Player Profiles**: Registration system generating unique sport-based Player IDs (e.g., `BDMN-00001`). Players can log in to view their stats and add themselves to multiple sport categories.
- **📋 Events Management**: Track upcoming, ongoing, and completed tournaments, complete with match history and results.
- **⚙️ Admin Panel**: Password-protected area to manage players, record match results, manually set player ranks, create events, and configure available sports.
- **💾 Local Storage**: Fully functional single-page application (SPA) using browser `localStorage` for data persistence. No complex backend or database required. Includes data Export/Import functionality for backups.

## 🛠️ Technology Stack

- **Pure HTML, CSS, JavaScript** — No frameworks or build tools required.
- **Responsive Design** — Custom CSS featuring a premium dark theme, glassmorphism UI, and fluid animations. Designed mobile-first.

## 🚀 How to Run

Because this app uses `localStorage` and plain web technologies, running it is incredibly simple:

1. Clone or download this repository.
2. Open the `index.html` file in any modern web browser.
3. *Alternatively*, deploy it instantly using services like **Vercel**, **Netlify**, or **GitHub Pages**.

## 🔑 Admin Access

- The Admin Panel is password-protected to ensure only organizers and coaches can manage tournaments, update records, and adjust player rankings.
- *Default access credentials are provided separately to authorized organizers.*

## 🏷️ Sports and Categories

The app supports multiple sports by default, and admins can easily add more:

- **Badminton**: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles
- **Basketball**: Men's 3x3, Women's 3x3, Men's 5v5, Women's 5v5
- **Volleyball**: Men's, Women's, Mixed
- **Table Tennis**: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles
- **Football**: Men's, Women's, Mixed

*(Custom sports can be added dynamically via the Admin panel, complete with custom emojis and categories).*

## 📱 Important Note on Storage

Data is stored in the browser's `localStorage`. This means data is specific to the device and browser being used. To move data between devices or create backups, use the **Export/Import** feature found in the Admin panel settings.
