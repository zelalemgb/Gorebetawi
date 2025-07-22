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

These environment variables are required when starting the Expo development server or building the app. Variables prefixed with `EXPO_PUBLIC_` are automatically exposed to the client by Expo.

3. Start the development server:

```bash
npm run dev
```

If these environment variables are not defined when the app starts, it will
automatically fall back to demo credentials so you can still run the project
locally. Defining them in a `.env` file is recommended if you want to connect to
your own Supabase project.
