# 🌬️ Breathe — Real-time Air Quality Intelligence

A beautiful, glassmorphism-styled **Air Quality Index (AQI) dashboard** that displays live pollution data for any city in the world. No API key required.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-38bdf8?style=for-the-badge)
![HTML](https://img.shields.io/badge/HTML-5-f97316?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-8b5cf6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-fbbf24?style=for-the-badge&logo=javascript&logoColor=black)

---

## ✨ Features

### Dashboard (`index.html`)
- 🔍 **Live city search** with debounced geocoding suggestions (Open-Meteo Geocoding API)
- 🌍 **8 Global Hotspot cards** loaded with live AQI at page start
- 📊 **Animated AQI ring** — SVG progress circle animates from 0 to current AQI
- 🎨 **Dynamic theming** — background and accent color change based on AQI level (6 themes)
- 📉 **6 pollutants** tracked with dynamic bar widths: PM2.5, PM10, NO₂, O₃, SO₂, CO
- 🔖 **Save locations** — bookmark cities to localStorage
- 📤 **Share** — Web Share API with clipboard fallback
- 🍞 **Toast notifications**
- ♿ **Accessible** — ARIA labels, live regions, semantic HTML

### Map View (`map.html`)
- 🗺️ **Interactive Leaflet.js map** with dark CartoDB tile layer
- 📍 **50+ city markers** loaded with real-time AQI, colour-coded by level
- 💬 **Glassmorphism popups** showing city name, AQI value, and status
- 🔄 **Refresh button** to reload all markers with fresh data

### Health Tips (`health.html`)
- 📋 **AQI scale guide** — all 6 levels with protective measures
- 👥 **Sensitive groups** — children, elderly, asthma, pregnant women, athletes
- 🔬 **Pollutant explainer** — WHO thresholds and health effects for all 6 pollutants
- 🛡️ **Protection strategies** — N95 masks, HEPA purifiers, timing outdoor activity
- ❓ **FAQ accordion** — 6 common questions answered

### General
- 📱 **Fully responsive** — works on mobile, tablet, and desktop
- 🌙 **Dark mode only** — premium dark glassmorphism aesthetic
- ⚡ **PWA-ready** — `manifest.json` included for home screen installation
- 🚫 **No dependencies** — pure HTML, CSS, and vanilla JavaScript
- 🔓 **No API keys** — 100% free, open-source data

---

## 🚀 Getting Started

No build step or server required. Just open the files in a browser.

```bash
# Clone the repository
git clone https://github.com/your-username/air-pollution-aqi-website.git
cd air-pollution-aqi-website

# Open in browser (Windows)
start index.html

# Or serve locally (optional, for PWA features)
npx serve .
```

> **Note:** The APIs used (`open-meteo.com`, `geocoding-api.open-meteo.com`) are called directly from the browser. No backend or proxy is needed.

---

## 📁 Project Structure

```
Air-Pollution-AQI-Website/
├── index.html      # Main dashboard — search, AQI ring, pollutants
├── map.html        # Interactive global AQI map (Leaflet.js)
├── health.html     # Health tips, AQI scale guide, FAQ
├── styles.css      # Shared design system (glassmorphism, themes, responsive)
├── app.js          # Dashboard logic — search, data fetch, UI updates
├── manifest.json   # PWA web app manifest
└── README.md       # This file
```

---

## 🌐 APIs Used

| API | Purpose | Cost |
|-----|---------|------|
| [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) | Real-time AQI & pollutant data | Free, no key |
| [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) | City name → lat/lon lookup | Free, no key |
| [CartoDB Dark Tiles](https://carto.com/basemaps/) | Dark map tiles for Leaflet | Free |
| [Leaflet.js](https://leafletjs.com/) | Interactive map rendering | Free, open-source |

---

## 🎨 Design System

| Feature | Value |
|---------|-------|
| Font | Outfit (Google Fonts) |
| Style | Glassmorphism — `backdrop-filter: blur(20px)` |
| Themes | 7 dynamic themes (default + 6 AQI levels) |
| Icons | Phosphor Icons |
| Animations | CSS keyframes + SVG stroke animation |

### AQI Colour Palette

| Level | Range | Colour |
|-------|-------|--------|
| Good | 0–50 | `#10b981` Emerald |
| Moderate | 51–100 | `#fbbf24` Amber |
| Unhealthy for Sensitive | 101–150 | `#f97316` Orange |
| Unhealthy | 151–200 | `#ef4444` Red |
| Very Unhealthy | 201–300 | `#8b5cf6` Purple |
| Hazardous | 301–500 | `#e11d48` Rose |

---

## 🛠️ Development

The project is intentionally zero-dependency vanilla HTML/CSS/JS. To contribute:

1. Fork the repo
2. Make changes directly to the source files
3. Test in a browser (no build step)
4. Open a pull request

---

## 📄 License

MIT License — free to use, modify, and distribute. See `LICENSE` for details.

---

## 🙏 Credits

- **Data:** [Open-Meteo](https://open-meteo.com/) (CC BY 4.0)
- **Map tiles:** © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, © [CARTO](https://carto.com/)
- **Icons:** [Phosphor Icons](https://phosphoricons.com/)
- **Map library:** [Leaflet.js](https://leafletjs.com/)

---

*Built with ❤️ for cleaner air.*
