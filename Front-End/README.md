# WorkMatrix FrontEnd

WorkMatrix FrontEnd is a modern, cross-platform web dashboard for the WorkMatrix employee monitoring system. It provides real-time insights, activity visualization, and management tools for both employees and administrators, integrating seamlessly with the WorkMatrix Background App and Supabase backend.

---

## 🚀 Features

- **User Authentication:** Secure login for employees and admins (Supabase Auth).
- **Role-Based Dashboards:** Separate views and permissions for employees and admins.
- **Activity Visualization:** Charts and tables for screenshots, app usage, and productivity.
- **Approval Workflows:** Admins can review and approve requests.
- **Responsive UI:** Built with Next.js, Tailwind CSS, and React for desktop and mobile.
- **API Integration:** Connects to Supabase for real-time data and actions.
- **Extensible:** Modular components for easy feature addition.

---

## 🗂️ Directory Structure

```
Front-End/
├── app/                # Next.js app directory (pages, layouts, routes)
├── components/         # Reusable React components
├── contexts/           # React context providers (e.g., Auth)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (e.g., Supabase client)
├── public/             # Static assets (images, icons)
├── services/           # API and business logic
├── styles/             # Global and component styles
├── types/              # TypeScript types and interfaces
├── .env.example        # Example environment variables
├── .gitignore          # Git ignore rules
├── next.config.mjs     # Next.js configuration
├── package.json        # NPM dependencies and scripts
├── postcss.config.mjs  # PostCSS configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

---

## ⚙️ Setup & Installation

### 1. **Clone the Repository**

```bash
git clone https://github.com/QuantumBreakz/WorkMatrix-FrontEnd.git
cd WorkMatrix-FrontEnd
```

### 2. **Install Dependencies**

```bash
npm install
# or
yarn install
```

### 3. **Configure Environment Variables**

Copy the example file and fill in your Supabase credentials:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. **Run the Development Server**

```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Scripts

| Command           | Description                       |
|-------------------|-----------------------------------|
| `npm run dev`     | Start development server          |
| `npm run build`   | Build for production              |
| `npm start`       | Start production server           |
| `npm run lint`    | Run ESLint                        |
| `npm run format`  | Format code with Prettier         |

---

## 🧑‍💻 Usage

- **Login:** Employees and admins log in with their Supabase credentials.
- **Dashboard:** Employees see their own activity, screenshots, and app usage. Admins see all users (if permitted by RLS).
- **Requests:** Admins can approve or reject employee requests.
- **Settings:** Users can update their profile and preferences.

---

## 🔒 Security & Privacy

- **No raw media is stored in the frontend.** Only summary data and metadata are displayed.
- **Role-based access:** Enforced via Supabase RLS and frontend logic.
- **Environment variables:** Never commit secrets; use `.env.local` for local development.

---

## 🧩 Extending the Frontend

- **Add new pages:** Create files in `app/` for new routes.
- **Add new components:** Place reusable UI in `components/`.
- **API integration:** Use `lib/supabase.ts` for all Supabase queries.
- **Type safety:** Use TypeScript types from `types/`.

---

## 🐞 Troubleshooting

- **Blank page or errors:** Check the browser console and terminal output.
- **Auth issues:** Ensure Supabase credentials are correct and RLS policies are set.
- **API errors:** Check Supabase logs and network requests.
- **Styling issues:** Run `npm run lint` and `npm run format`.

---

## 📦 Deployment

- **Vercel:** Recommended for Next.js. Connect your repo and set environment variables.
- **Other platforms:** Any Node.js-compatible host will work.

---

## 🤝 Contributing

1. Fork the repo and create your feature branch (`git checkout -b feature/YourFeature`)
2. Commit your changes (`git commit -am 'Add new feature'`)
3. Push to the branch (`git push origin feature/YourFeature`)
4. Open a pull request

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙋 Support

For questions or support, open an issue or contact the maintainer.

---

**Repository:** [QuantumBreakz/WorkMatrix-FrontEnd](https://github.com/QuantumBreakz/WorkMatrix-FrontEnd) 