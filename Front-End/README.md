# WorkMatrix Front-End

The front-end application for WorkMatrix, built with Next.js 13 and Supabase.

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

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- Supabase project

### Development Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
pnpm build
pnpm start
```

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

## Troubleshooting

Common issues and solutions:

1. **Build Errors**
   - Clear `.next` directory
   - Remove `node_modules` and reinstall
   - Check TypeScript errors

2. **Runtime Errors**
   - Check environment variables
   - Verify Supabase connection
   - Check console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details. 