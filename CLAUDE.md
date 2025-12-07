# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

## Project Architecture

This is a React/TypeScript Bitcoin analytics dashboard built with Vite. The application displays Bitcoin price data with interactive charts and AI-powered market insights.

### Core Structure

- **Entry Point**: `index.tsx` → `App.tsx`
- **Components**: Modular React components in `/components/`
- **Services**: API integration in `/services/cryptoService.ts`
- **Types**: TypeScript definitions in `types.ts`
- **Styling**: TailwindCSS via CDN with custom CSS in `index.html`

### Key Components

- `Layout.tsx` - Main application layout with navigation
- `CandleChart.tsx` - Interactive Bitcoin price chart using Recharts
- `AnalysisPanel.tsx` - Market analysis display
- `InsightCard.tsx` - AI-powered market insights
- `TheorySteps.tsx` - Educational content about Bitcoin cycles
- `FAQSection.tsx` - Frequently asked questions

### Data Flow

1. **API Integration**: `cryptoService.ts` fetches data from Binance API (primary) and CoinGecko (fallback)
2. **Real-time Updates**: Price data refreshes every 10 seconds
3. **Chart Data**: Historical candlestick data filtered from 2023-01-01
4. **Highlight Periods**: Predefined Bitcoin cycle periods with analysis

### Key Features

- **Multi-language Support**: English/Chinese (`Language` type)
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Real-time Data**: Live Bitcoin price updates
- **Interactive Charts**: Recharts-based candlestick charts with EMA indicators
- **Cycle Analysis**: Predefined highlight periods for Bitcoin market cycles
- **Fallback Data**: Mock data generation when APIs fail

### Environment Configuration

- Uses Vite for build tooling
- Environment variables loaded via `.env.local`
- Gemini API key configured for AI features
- Development server runs on port 3000

### Deployment

- Automated deployment to Cloudflare Pages via GitHub Actions
- Builds triggered on pushes to `main` branch
- Uses Node.js 18 in CI/CD pipeline

### Technical Notes

- **TypeScript**: Strict typing with custom interfaces for market data
- **State Management**: React hooks for local state
- **API Error Handling**: Graceful fallbacks between multiple data sources
- **Performance**: Memoized chart data and optimized re-renders
- **Accessibility**: Proper semantic HTML and ARIA attributes