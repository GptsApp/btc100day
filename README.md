# BTC 100-Day Bull Run Theory Dashboard

A real-time Bitcoin analysis dashboard based on the "100-Day Bull Run Theory" with AI-powered market insights.

## Features

- 📈 Real-time BTC price updates (every 5 seconds)
- 📊 Interactive candlestick chart with EMA15 indicator
- 🤖 AI-powered market analysis using DeepSeek V3.2
- 🌐 Bilingual support (English/Chinese)
- 📱 Responsive design for all devices
- ⚡ Fast deployment with Cloudflare Pages

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `API_KEY` in `.env` to your DeepSeek API key:
   ```bash
   API_KEY=your_deepseek_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for automatic deployment to Cloudflare Pages via GitHub Actions.

### Environment Variables

Set the following in Cloudflare Pages:
- `API_KEY`: Your DeepSeek API key

## Theory Overview

The 100-Day Bull Run Theory identifies four phases:
1. **Observation (Day 0-30)**: Watch for breakout signals
2. **Confirmation (Day 30-70)**: Best entry window
3. **Warning (Day 70-100)**: Prepare for exit
4. **Rest (Day 100+)**: Wait for next cycle

## Tech Stack

- React 19 + TypeScript
- Vite for build tooling
- Recharts for data visualization
- Tailwind CSS for styling
- DeepSeek API for AI analysis
- Binance API for price data