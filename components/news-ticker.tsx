"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AlertCircle, Film, Newspaper, FileText } from "lucide-react"

export function NewsTicker() {
  const [updates, setUpdates] = useState<{ type: 'news' | 'blog' | 'movie', title: string }[]>([])

  useEffect(() => {
    async function fetchLatestUpdates() {
      try {
        console.log("Fetching ticker updates...")
        // Fetch latest news
        const newsQuery = query(
          collection(db, "artifacts/default-app-id/news"),
          orderBy("publishedAt", "desc"),
          limit(5),
        )
        const newsSnapshot = await getDocs(newsQuery)
        console.log("News found:", newsSnapshot.size)
        const newsItems = newsSnapshot.docs.map((doc) => ({ type: 'news' as const, title: doc.data().title }))

        // Fetch latest blogs
        const blogsQuery = query(
          collection(db, "artifacts/default-app-id/blogs"),
          orderBy("publishedAt", "desc"),
          limit(5),
        )
        const blogsSnapshot = await getDocs(blogsQuery)
        console.log("Blogs found:", blogsSnapshot.size)
        const blogItems = blogsSnapshot.docs.map((doc) => ({ type: 'blog' as const, title: doc.data().title }))

        // Fetch latest movies
        const moviesQuery = query(
          collection(db, "artifacts/default-app-id/movies"),
          orderBy("releaseDate", "desc"),
          limit(5),
        )
        const moviesSnapshot = await getDocs(moviesQuery)
        console.log("Movies found:", moviesSnapshot.size)
        const movieItems = moviesSnapshot.docs.map((doc) => ({ type: 'movie' as const, title: doc.data().title }))

        // Interleave items: Movie -> News -> Blog -> Movie ...
        const maxLength = Math.max(newsItems.length, blogItems.length, movieItems.length)
        const combined: typeof updates = []

        for (let i = 0; i < maxLength; i++) {
          if (movieItems[i]) combined.push(movieItems[i])
          if (newsItems[i]) combined.push(newsItems[i])
          if (blogItems[i]) combined.push(blogItems[i])
        }

        setUpdates(combined)
      } catch (error) {
        console.error("[v0] Error fetching updates:", error)
      }
    }

    fetchLatestUpdates()
  }, [])

  if (updates.length === 0) return null

  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden border-b border-white/10 relative z-30">
      <div className="container mx-auto px-4 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 bg-primary/20 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm relative z-10">
          <AlertCircle className="h-4 w-4 text-yellow-400 animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider">Latest Updates</span>
        </div>
        <div className="flex-1 overflow-hidden relative mask-linear-fade">
          <div className="animate-marquee whitespace-nowrap flex items-center min-w-full w-max">
            {/* Repeat content to fill screen */}
            {[...updates, ...updates, ...updates].map((update, index) => (
              <span key={index} className="inline-flex items-center mx-6 text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
                {update.type === 'movie' && <Film className="w-4 h-4 mr-2 text-yellow-500" />}
                {update.type === 'news' && <Newspaper className="w-4 h-4 mr-2 text-blue-400" />}
                {update.type === 'blog' && <FileText className="w-4 h-4 mr-2 text-orange-400" />}
                {update.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
        .animate-marquee {
          animation: marquee 30s linear infinite; /* Slower loop because track is longer */
          width: max-content;
        }
        @media (max-width: 768px) {
           .animate-marquee {
             animation-duration: 30s; /* Slower on mobile */
           }
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
