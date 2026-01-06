# Movie Reporter - Website Features

This document outlines the comprehensive feature set of the Movie Reporter platform.

## 🎬 Public Features (Guest & User)

### 🏠 Home Page
- **Dynamic Content**: Auto-updating sections for Latest Movies, Featured News, Blogs, and Upcoming Releases.
- **Hero Banner**: Rotating highlight reel for top content.
- **News Ticker**: Real-time scrolling updates for breaking news.
- **Weekly Magazine**: Dedicated section for curated weekly stories.
- **Celebrity Profiles**: Carousel showcasing popular stars.
- **Infinite Scroll / Load More**: "Load More" cards for seamless content exploration.

### 🎥 Movies & Entertainment
- **Movie Details**: Comprehensive info including rating, cast, release date, and industry.
- **Trailers**: Integrated YouTube player for trailers.
- **OTT Availability**: Icons showing where to watch (Netflix, Prime, etc.).
- **Reviews**: User and critic reviews with star ratings.
- **Vote Enroll**: Specialized section for voting on movies across industries (Tollywood, Bollywood, etc.).
- **Award Winners**: Archive of past award winners filterable by year and industry.
- **Top Box Office**: Tracking commercial performance.
- **Upcoming Releases**: Calendar of future movie launches.

### 📰 News & Blogs
- **Latest News**: Chronological news feed with categorization.
- **Blogs**: In-depth articles and opinions.
- **Share Functionality**: Native share (Mobile) and Clipboard copy (Desktop) with rich previews.
- **Rich Media**: Support for images and potentially video content in articles.

### 🌟 Celebrities
- **Profiles**: Biographies, filmography, and photos.
- **Filmography**: Horizontal scroll of movies the celebrity has acted in.
- **Related Celebrities**: "You might also like" recommendations.

### 🗳️ Polls
- **Live Polls**: Interactive voting on trending topics.
- **Completed Polls**: Archive of past poll results.
- **Real-time Results**: Instant feedback after voting.

### 🔍 Search & Navigation
- **Global Search**: Overlay search to find movies, celebs, and news instantly.
- **Filtering**: Filter by industry, genre, or category.
- **Theme Support**: Dark/Light mode toggle.
- **Multi-language Support**: Interface for language selection (UI ready).

---

## 👤 User Features (Authenticated)

- **Authentication**: Secure Login/Signup via Firebase (Email/Password, Google).
- **Profile Management**: Customizable user profile.
- **Reactions**: 
  - Like/Dislike Movies, News, and Blogs.
  - React to Comments with Emojis (👍, ❤️, 😂, etc.).
- **Comments**: Detailed commenting system with edit/delete support.
- **Saved Content**:
  - **Saved News**: Bookmark news articles to read later (Profile integration).
  - **Saved Blogs**: Save favorite blog posts.
  - **Favorites**: "Like/Follow" Celebrities to track their updates.
- **User Reviews**: Submit detailed movie reviews and ratings.

---

## 🛡️ Admin Features (Role-Based)

- **Dashboard**: Overview of site activity and metrics (Views, Users, Content).
- **Moderation Console**: 
  - **Comments**: Review and delete user comments.
  - **Reviews**: moderate movie reviews.
  - **Activity Logs**: Track admin actions (deletions, updates).
- **Content Management**:
  - **Movies**: Create, Edit, Delete movie entries with complex metadata (Cast, OTT, Crew).
  - **News & Blogs**: Rich text editor for articles.
  - **Celebrities**: Manage star profiles and filmography connections.
  - **Polls**: Create and manage time-limited polls.
  - **Awards**: Manage nominees and winners.
- **Image Upload**: Integrated media manager for posters and banners.
- **Alerts**: System notifications for admin actions.

---

## 🛠️ Technical Features

- **PWA Ready**: Mobile-first design acting like a native app.
- **SEO Optimized**: Server-Side Rendering (SSR) for metadata (Open Graph tags for social sharing).
- **Dynamic Routing**: URL-friendly routes for movies, news, and celebrities.
- **Performance**: 
  - Image Optimization via Next.js.
  - Client-side caching for fast navigation.
  - Lazy loading for heavy components.
- **Security**: Firebase security rules used for data protection.
