# Movie Lovers V3 🎬
 
Movie Lovers is a next-generation film news, voting, and database platform built with **Next.js 14**, **Tailwind CSS**, and **Firebase**. It features a stunning UI/UX with glassmorphism, smooth animations, and a powerful Admin "Mission Control" Dashboard.

## 🚀 Features

### User Experience
*   **Dynamic Home Page**: Trending movies, latest news, and reels-style content.
*   **Voting System**: Interactive polls for "Best Actor", "Best Movie" with real-time results.
*   **News & Blogs**: Rich text articles with comments and social sharing.
*   **Movie Database**: Detailed pages for movies and celebrities with cast info, trailers, and ratings.
*   **Mobile-First Design**: Bottom navigation, swipe gestures, and PWA support.
*   **Advanced Search**: Fast, filtering-capable search for all content types.

### Admin "Mission Control" 🛡️
*   **Ultimate Dashboard**: Real-time system health (VPS monitoring), key metrics, and activity pulse.
*   **Content Management**: Full CRUD for Movies, Celebrities, News, and Awards.
*   **Moderation Tools**: Review and delete user comments and reviews.
*   **Security Snapshot**: Monitor admin access and potential threats.
*   **Analytics**: Visual insights into user growth and content performance.

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
*   **Backend / DB**: [Firebase](https://firebase.google.com/) (Firestore, Storage, Auth)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Animations**: Framer Motion
*   **Charts**: Recharts

---

## ⚙️ Installation & Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/movie-reporter-v3.git
    cd movie-reporter-v3
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your Firebase config:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## ☁️ Deployment Guide (Hostinger VPS)

This project is optimized for deployment on a **Hostinger VPS** using Node.js.

### 1. Build for Production
The app is configured with `output: 'standalone'` in `next.config.mjs`, which creates a lightweight build perfect for VPS.

```bash
npm run build
```

This will create a `.next/standalone` folder.

### 2. Upload to VPS
Upload the following to your VPS (via FileZilla or scp):
1.  `.next/standalone` folder (contains the server).
2.  `.next/static` folder (upload this to `.next/standalone/.next/static`).
3.  `public` folder (upload to `.next/standalone/public`).

### 3. Start the Server
Connect to your VPS via SSH and run:

```bash
cd /path/to/extracted/standalone
node server.js
```
*Tip: Use `pm2` to keep it running in the background:*
```bash
npm install -g pm2
pm2 start server.js --name "movie-reporter"
```

### 4. System Health Monitoring
The Admin Dashboard includes a real-time **System Health** widget. Once deployed on the VPS, it will show:
*   **Actual CPU Load**
*   **Real RAM Usage**
*   **Server Uptime**

---

## 📂 Project Structure

```
├── app/                # Next.js App Router pages
│   ├── admin/          # Admin Dashboard & CMS routes
│   ├── (public)/       # Public facing pages (Home, Movies, etc.)
│   └── api/            # API Routes (Health check, internal logic)
├── components/         # Reusable UI components
│   ├── admin/          # Admin-specific widgets (Charts, Alerts)
│   ├── ui/             # Shadcn UI primitives (Buttons, Cards)
│   └── ...
├── lib/                # Utility functions & Firebase config
├── public/             # Static assets (images, icons)
└── ...
```

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---

**Developed for Movie Reporter V3**
