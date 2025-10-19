# DuitTrack: Smart Personal Expense Tracking

## Quick Overview
DuitTrack is a mobile-first web application for personal expense tracking and smart budgeting, designed specifically for the Indonesian market.

## Key Features
- 💰 Smart Budget Management
- 📊 Detailed Expense Tracking
- 🇮🇩 Full Indonesian Localization
- 💱 Native Rupiah Support
- 📱 Mobile-First Design

## Documentation
Comprehensive documentation is available in the `documentation/` directory:
- 01_PROJECT_OVERVIEW.md
- 02_TECHNICAL_ARCHITECTURE.md
- 03_UX_DESIGN_PATTERNS.md
- 04_DEVELOPMENT_ROADMAP.md
- 05_IMPLEMENTATION_GUIDE.md

## Tech Stack
- Vite
- Svelte
- TypeScript
- Firebase Firestore
- Tailwind CSS

## Getting Started

### Quick Start (Windows)
Double-click `start-dev.bat` to launch the development server automatically.

### Manual Start
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration
4. Run development server: `npm run dev -- --port 3000 --host`
5. Open browser at: `http://localhost:3000`

### Important Notes
- **This is a SvelteKit application** - Do NOT use `http-server` or other static file servers
- Always use `npm run dev` for development
- Default port: 3000
- The app includes routing for `/budget`, `/dashboard`, `/tracking`, etc.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License
MIT License

---
Made with ❤️ for Indonesian Personal Finance Management