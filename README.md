# Gorebet Civic App

This project uses Supabase for authentication and data storage. To run the app you need to provide your Supabase project credentials.

## Setup

1. Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

2. Edit the new `.env` file and add your Supabase URL and anon key. This project uses the following Supabase credentials:

```text
EXPO_PUBLIC_SUPABASE_URL=https://mjohmhcctepekglsbmuf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qb2htaGNjdGVwZWtnbHNibXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzY3MzQsImV4cCI6MjA2NDUxMjczNH0.mR4lTASrj_1jMxr8Fa6XHlkQNzANQvMqtNN9YW1G0A4
```

Make sure to save the file **before** starting the development server. If you
edit or create `.env` while the server is running, stop the server and restart
it so the new variables are loaded.

These environment variables are required when starting the Expo development server or building the app. Variables prefixed with `EXPO_PUBLIC_` are automatically exposed to the client by Expo.

If you see an error like `Missing Supabase environment variables`, double-check that the `.env` file exists, contains your Supabase credentials and that you've restarted the development server.

3. Start the development server:

```bash
npm run dev
```

If the environment variables are missing, the app will throw an error during startup.

## Linting

This project uses Expo's built-in linter. To run the lint checks locally first install the dependencies and then run the `lint` script:

```bash
npm install
npm run lint
```

The script uses `npx expo` so you do not need to install the Expo CLI globally.
