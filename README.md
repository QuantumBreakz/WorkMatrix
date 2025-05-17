# WorkMatrix

A modern employee monitoring and time tracking solution built with Next.js 13, Supabase, and Tailwind CSS.

## Features

- 🔐 Secure Authentication with Supabase
- 👥 Role-based Access Control (Admin/Employee)
- ⏱️ Time Tracking
- 📊 Activity Monitoring
- 📸 Screenshot Capture
- 📈 Productivity Analytics
- 📱 Responsive Design
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 13 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **State Management**: React Query, Context API
- **Icons**: Lucide Icons

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/QuantumBreakz/WorkMatrix.git
```

2. Install dependencies:
```bash
cd WorkMatrix/Front-End
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the Front-End directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Front-End/
├── app/                    # Next.js 13 app directory
├── components/            # Reusable components
├── config/               # Configuration files
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and libraries
├── public/              # Static assets
└── styles/              # Global styles
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 