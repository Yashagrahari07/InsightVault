# InsightVault Frontend

React + TypeScript frontend for InsightVault - AI-powered knowledge management platform.

## Features

- React 18 with TypeScript
- TailwindCSS for styling
- React Router for navigation
- React Query for API state management
- Axios for API calls
- Vite for build tooling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/          # Page components
  ├── hooks/          # Custom React hooks
  ├── services/       # API service functions
  ├── store/          # State management
  ├── types/          # TypeScript types
  └── utils/          # Utility functions
```

