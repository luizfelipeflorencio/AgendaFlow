# AgendaFlow - Online Scheduling System

A full-stack online scheduling system built with React, Express, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account (optional, for production)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your environment variables (see Environment Setup below).

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔧 Environment Setup

The application requires a `.env` file in the root directory. Use `.env.example` as a template.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `3000` |
| `SESSION_SECRET` | Secret key for session management | `your-secret-key-here` |

### Optional Variables (for Supabase integration)

| Variable | Description | How to get |
|----------|-------------|------------|
| `SUPABASE_URL` | Your Supabase project URL | See `ONDE_ENCONTRAR_CREDENCIAIS_SUPABASE.md` |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | See `ONDE_ENCONTRAR_CREDENCIAIS_SUPABASE.md` |

### Development vs Production

- **Development Mode**: If Supabase credentials are not provided, the app will use in-memory storage
- **Production Mode**: Supabase credentials are required for data persistence

## 📁 Project Structure

```
AgendaFlow/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and configurations
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Storage abstraction layer
│   └── supabase*.ts     # Supabase integration
├── shared/              # Shared types and schemas
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Environment variables template
└── package.json         # Dependencies and scripts
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | Run TypeScript type checking |

## 🗄️ Database Setup

### Option 1: Development (In-Memory Storage)
No setup required. Just run `npm run dev` without Supabase credentials.

### Option 2: Production (Supabase)
1. Create a Supabase project
2. Get your credentials (see `ONDE_ENCONTRAR_CREDENCIAIS_SUPABASE.md`)
3. Update your `.env` file
4. Run the SQL script from `supabase-setup.sql` in your Supabase SQL editor

For detailed Supabase setup instructions, see `SUPABASE_SETUP.md`.

## 🚀 Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Set up production environment variables**

3. **Start the production server:**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking: `npm run check`
5. Submit a pull request

## 📝 License

MIT License - see the LICENSE file for details.