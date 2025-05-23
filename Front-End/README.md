# WorkMatrix Frontend

This folder contains the frontend (written in Next.js) for WorkMatrix. It connects to the backend (Background-App) via WebSocket and REST API endpoints and uses Supabase for real-time updates and authentication.

## Tech Stack

- **Framework**: [Next.js 13](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query) & Context API
- **Forms**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [Lucide Icons](https://lucide.dev/)

## Project Structure

```
src/
├── app/                    # Next.js 13 app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── (marketing)/       # Marketing pages
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── dashboard/        # Dashboard components
│   └── auth/             # Auth components
├── config/               # Configuration files
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
│   ├── api/            # API utilities
│   ├── services/       # Service integrations
│   └── utils/          # Helper functions
├── public/              # Static assets
├── styles/             # Global styles
├── types/              # TypeScript types
└── supabase/           # Supabase configurations
```

## Prerequisites

- Node.js (v 18 or higher) and pnpm (or npm) installed.
- (Optional) A running instance of the backend (Background-App) (see [Background-App/README.md](../Background-App/README.md) for local deployment).

## Deployment (Local)

### Running the Frontend

1. Open a terminal and navigate to the Front-End folder (e.g. `cd /path/to/surveillance-Application-main/Front-End`).
2. Install dependencies (using pnpm or npm):
   ```sh
   pnpm install
   # (or npm install)
   ```
3. Start the development server:
   ```sh
   pnpm dev
   # (or npm run dev)
   ```
   This will start the Next.js server (usually on http://localhost:3000).

### Connecting to the Backend

- The frontend connects to the backend (Background-App) via a custom WebSocket service (using `useWebSocket` in `websocket-service`) and REST API endpoints.
- Ensure that the backend is running (using the "clickable" scripts in `Background-App/scripts/` (see [Background-App/scripts/README.md](../Background-App/scripts/README.md) for details)).
- (Optional) If you run the backend locally, update your environment variables (e.g. in a `.env.local` file) so that the frontend points to the correct backend URL (e.g. `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`).

### Supabase Integration

- The frontend uses Supabase for real-time updates (via Realtime subscriptions) and authentication.
- (Refer to the Supabase integration documentation (e.g. in `Front-End/supabase-integration.js`) for further details.)

## How Everything Is Tied Together

- **Backend (Background-App):**
  - The backend (Background-App) (see [Background-App/README.md](../Background-App/README.md)) is responsible for collecting (screenshots, activity, etc.) and synchronizing data (via Supabase) and exposing a WebSocket server and REST API endpoints.
  - (See [Background-App/scripts/README.md](../Background-App/scripts/README.md) for details on the "clickable" scripts (macOS, Linux, Windows) to run the backend locally.)

- **Frontend (Front-End):**
  - The frontend (written in Next.js) connects to the backend via a custom WebSocket service (using `useWebSocket` in `websocket-service`) and REST API endpoints.
  - It also uses Supabase for real-time updates (via Realtime subscriptions) and authentication.
  - (Refer to the Front-End README (this file) for further details.)

## Troubleshooting

- **Build Errors:** Clear the `.next` directory, remove `node_modules` (and reinstall), and check TypeScript errors.
- **Runtime Errors:** Check your environment variables (e.g. in a `.env.local` file), verify your Supabase connection, and check the console (or logs) for errors.
- **Backend Connection:** Ensure that the backend (Background-App) is running (using the "clickable" scripts) and that your frontend environment variables (e.g. `NEXT_PUBLIC_BACKEND_URL`) are set correctly.

## Further Documentation

- For details on the backend (Background-App) and its "clickable" scripts, see [Background-App/README.md](../Background-App/README.md) and [Background-App/scripts/README.md](../Background-App/scripts/README.md).

## Features

### Authentication
- Email/Password authentication
- OAuth providers (Google, GitHub)
- Role-based access control
- Protected routes
- Session management

### Dashboard
- Employee monitoring
- Time tracking
- Screenshot capture
- Activity analytics
- Team management
- Project tracking

### Admin Features
- User management
- Team analytics
- Activity monitoring
- System settings
- Report generation

## Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting. Configuration files are included in the repository.

```bash
# Run linter
pnpm lint

# Format code
pnpm format
```

### Component Guidelines

1. Use TypeScript for all new components
2. Follow the component structure:
```tsx
// components/Example.tsx
interface ExampleProps {
  // Props interface
}

export function Example({ prop1, prop2 }: ExampleProps) {
  // Component logic
  return (
    // JSX
  )
}
```

3. Use shadcn/ui components when possible
4. Implement proper error boundaries
5. Add proper TypeScript types

### State Management

- Use React Query for server state
- Use Context for global UI state
- Use local state for component-specific state

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## API Integration

### Supabase

We use Supabase for:
- Authentication
- Database
- Real-time subscriptions
- Storage

Example usage:
```typescript
import { supabase } from '@/lib/supabase'

// Query data
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', 'value')
```

### Background Service Integration

Communication with the background service happens through:
- WebSocket connections
- REST API endpoints
- File system operations

## Deployment

### Production Deployment

1. Build the application:
```bash
pnpm build
```

2. Set up environment variables on your hosting platform

3. Deploy the application:
```bash
pnpm deploy
```

### Continuous Integration

We use GitHub Actions for CI/CD. Workflows are defined in `.github/workflows/`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 