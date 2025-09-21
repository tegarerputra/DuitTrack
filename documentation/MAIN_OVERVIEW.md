# 💰 DuitTrack - Project Overview

## 📋 Project Description
**DuitTrack** is a mobile-first expense tracking web application built with Svelte and Vite, designed to provide an intuitive and intelligent financial tracking experience for Indonesian users.

## 🏗️ Technical Architecture

### Frontend Stack
- Svelte 4.x with TypeScript
- Vite build tool with code splitting
- HTML5 with semantic structure
- CSS3 with custom properties and glassmorphism effects
- Mobile-first responsive design (430px optimization)

### Backend Integration
- Firebase Authentication (Google OAuth)
- Firestore for real-time data storage and synchronization

### Deployment Infrastructure
- Hosting: Netlify
- Domain: duittrack.farahtegar.com
- Continuous Deployment: GitHub → Netlify automatic pipeline

## 🚀 Key Features
- Intelligent expense tracking
- AI-powered financial insights
- Real-time Indonesian Rupiah formatting
- Google OAuth authentication
- Glassmorphism UI design
- Mobile-optimized performance

## 📁 Project Structure
```
DuitTrack/
├── src/
│   ├── lib/
│   │   └── components/
│   │       ├── auth/
│   │       ├── budget/
│   │       └── dashboard/
│   ├── routes/
│   ├── app.html
│   └── app.css
├── static/
├── build/
├── .svelte-kit/
├── package.json
├── svelte.config.js
├── vite.config.js
├── tailwind.config.js
└── documentation/
```

### Project Structure Highlights
- `src/`: Primary source code directory
  - `lib/components/`: Reusable Svelte components
  - `routes/`: SvelteKit file-based routing
- `static/`: Static assets and files
- Configuration files for Svelte, Vite, and Tailwind CSS

## 🎯 Current Development Focus
- Advanced budget management
- Expense analytics
- Progressive Web App (PWA) implementation
- Machine learning-powered spending recommendations

## 📋 Vite + Svelte Migration
- **Migration Status**: Complete
- Fully transitioned from vanilla JavaScript to SvelteKit
- Enhanced performance and developer experience
- Modern, modular, and scalable application architecture

**Last Updated**: September 21, 2025
**Status**: Fully deployed Svelte-based web application