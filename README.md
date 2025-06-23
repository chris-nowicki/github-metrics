# GitHub Metrics Dashboard

A Next.js application that demonstrates how to use Vercel Cron Jobs to efficiently display GitHub metrics. Instead of fetching data from GitHub's API on every page load, this app uses scheduled background jobs to periodically update a database with the latest commit counts and repository information.

## Features

- 📊 **Real-time GitHub Metrics**: Display total commits and repositories
- ⏰ **Vercel Cron Jobs**: Automated data synchronization
- 🚀 **Fast Performance**: Pre-computed data for instant page loads
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🎨 **Modern UI**: Clean, shadcn/ui-inspired design
- 📚 **Documentation**: Built-in docs with markdown support and Mermaid diagrams

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon (PostgreSQL)
- **Deployment**: Vercel
- **Cron Jobs**: Vercel Cron
- **APIs**: GitHub REST API

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- GitHub Personal Access Token
- Neon database

### Installation

1. Clone the repository:

```bash
git clone https://github.com/chris-nowicki/github-metrics.git
cd github-metrics
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Add your environment variables:

```env
GITHUB_TOKEN=your_github_personal_access_token
DATABASE_URL=your_neon_database_url
```

4. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## How It Works

1. **Cron Job**: A Vercel Cron Job runs periodically (configured in `vercel.json`)
2. **Data Sync**: The cron job fetches latest GitHub metrics via the GitHub API
3. **Database Storage**: Metrics are stored in a Neon PostgreSQL database
4. **Fast Display**: The web app displays pre-computed data for instant loading

## Project Structure

```
├── app/
│   ├── api/
│   │   └── github-metrics-sync/   # Cron job endpoint
│   ├── page.tsx                   # Main landing page
│   └── layout.tsx                 # Root layout
├── lib/
│   └── neondb-service.ts          # Database service
├── public/                        # Static assets
└── vercel.json                    # Vercel configuration & cron jobs
```

## API Endpoints

- `GET /api/github-metrics-sync` - Manually trigger metrics sync (also used by cron)

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chris-nowicki/github-metrics)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

The cron job will automatically start running based on the schedule in `vercel.json`.

## Environment Variables

| Variable       | Description                     | Required |
| -------------- | ------------------------------- | -------- |
| `GITHUB_TOKEN` | GitHub Personal Access Token    | Yes      |
| `DATABASE_URL` | Neon database connection string | Yes      |
| `CRON_SECRET`  | Vervel Cron Secret              | Yes      |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Chris Nowicki**

- Website: [chrisnowicki.dev](https://www.chrisnowicki.dev)
- GitHub: [@chris-nowicki](https://github.com/chris-nowicki)

---

Made with ❤️ using Next.js and Vercel
