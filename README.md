# LMS Bot Marker Backend

A Node.js + TypeScript backend for the LMS Bot Marker application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
PORT=3000
```

## Development

To run the development server:
```bash
npm run dev
```

## Production

To build and run for production:
```bash
npm run build
npm start
```

## Project Structure

```
├── src/              # Source files
├── dist/             # Compiled files
├── .env              # Environment variables
├── package.json      # Project dependencies
└── tsconfig.json     # TypeScript configuration
```