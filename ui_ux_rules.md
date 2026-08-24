# UI/UX Design System & Rules (Playbook 2026)

This document outlines the core UI/UX design principles and standards applied across the **Varsity Sports Player Tracker** application, based on the **UI/UX Playbook 2026**.

---

## 1. Visual Hierarchy & Data Metrics
- **Prominent Metrics**: Important data points (Winrate %, Wins, Losses, Rank #) must always be the visual hero of any card or stat display with larger font size (1.5rem–2.25rem), heavy font weight (`Outfit`, 700–900), and vibrant accent colors.
- **Subtle Labels**: Metric titles and descriptive tags should be concise (1–2 words), smaller (0.75rem–0.85rem), and styled in muted secondary text (`var(--text-muted)`).
- **Dismiss Plain `label: value` Lists**: Use visual storytelling with badges, icons, metallic ribbons/borders, and glassmorphism cards rather than flat text stacks.

---

## 2. Actionable Empty States
- **Never Generic "No Items"**: Empty states must never be a lifeless one-liner like "No results".
- **Three-Part Empty State Structure**:
  1. **Visual Cue / Icon**: High-contrast, stylized sports icon or illustration.
  2. **Engaging Contextual Copy**: Friendly explanation of what belongs here and how it gets populated.
  3. **Direct Action Button (CTA)**: A clear button guiding the user to the next step (e.g., *"Reset Active Filters"*, *"Register as Athlete"*, *"Create Tournament"*).

---

## 3. Law of Proximity in Form Design
- **Tight Label-to-Input Spacing**: Keep labels and their corresponding input fields tightly grouped (4px–6px / 0.35rem) so users instantly recognize which label belongs to which field.
- **Generous Field-to-Field Separation**: Separate distinct form groups and rows with comfortable spacing (18px–24px / 1.25rem).
- **Clear Section Delimiters**: Use subtle border dividers and section headers when grouping multiple related sub-controls.

---

## 4. Input Field Length Optimization
- **Match Field Width to Input Length**: Do not stretch every input field to full width uniformly.
  - Short inputs (Ranks, Scores, Section codes, Short dates, Zip codes) should occupy tailored, compact widths or multi-column grids (2-column / 3-column rows).
  - Longer inputs (Full names, Tournament titles, Descriptions) can occupy standard full widths.

---

## 5. Creative Selectable Cards & Option Pills
- **Avoid Bland Radio Lists**: Replace traditional vertical text radio buttons and plain select lists with interactive, responsive **selectable cards and pill buttons**.
- **Interactive Feedback**: Provide instant visual feedback with hover lifts, subtle gradients, and glowing active borders (`box-shadow: 0 0 16px var(--accent-primary-glow)`).

---

## 6. Thumb Zone & Touch Targets (Mobile-First)
- **Minimum Tap Target**: All interactive elements (buttons, nav pills, filter dropdowns, modal close buttons) must maintain a minimum touch area of **44px × 44px** on mobile screens.
- **Generous Tap Spacing**: Maintain at least **8px–12px** spacing between adjacent touch targets to eliminate misclicks.
- **Ergonomic Action Placement**: Position primary mobile actions and CTAs within easy thumb reach at the bottom or middle zone of the screen.

---

## 7. Typography & Readability
- **Line Length**: Paragraphs and descriptive text should adhere to the **45–75 character range** for effortless eye tracking and reading comfort.
- **Line Heights**:
  - Headings (`h1`, `h2`, `h3`): **115%–125%** for crisp, modern balance.
  - Body & Paragraphs: **150%–160%** for maximum legibility without eye strain.
- **Text Alignment**:
  - Left-align body copy, descriptions, and lists longer than 3 lines.
  - Center-align only short headlines, metric cards, and badge titles for formality and symmetry.
- **Contrast & Accessibility**: Maintain calibrated WCAG AA/AAA contrast ratios across all dark-mode glass surfaces.
