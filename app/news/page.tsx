"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { collection, query, orderBy, limit, getDocs, where, Timestamp, startAfter, QueryConstraint } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { ArticleCard } from "@/components/article-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Newspaper } from "lucide-react"
import { NewsCardSkeleton } from "@/components/skeletons"

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  const NEWS_LOAD_LIMIT = 12

  // Observer Logic
  const lastNewsElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchNews(false)
      }
    })

    if (node) observer.current.observe(node)
  }, [loading, hasMore])

  useEffect(() => {
    setNews([])
    setLastVisible(null)
    setHasMore(true)
    // Small delay to ensure state reset before fetch in strict mode
    setLoading(true)
    fetchNews(true)
  }, [categoryFilter])

  const fetchNews = async (isInitial = false) => {
    if (loading && !isInitial) return;

    // Construct cache key based on filters
    // Only cache if clean search/filter on initial load? Or cache per filter?
    // Let's cache per categoryFilter for the initial load. Search terms might be too granular/variable.
    // We'll only cache the first page (initial load).
    const cacheKey = `news_initial_${categoryFilter}`

    // Check cache FIRST
    if (isInitial && !searchTerm) {
      const cached = getFromCache<any>(cacheKey)
      if (cached) {
        setNews(cached.data)
        // Set lastVisible using the serialized string for now, but the fetch below will overwrite it with a real snapshot if successful
        const cursor = cached.lastScheduledAt
        setLastVisible(cursor)
        setHasMore(true)
        // We do NOT return here. We let the fetch continue (Stale-While-Revalidate).
        // If we have cached data, we don't need to show the loading skeleton.
        setLoading(false)
      } else {
        // Only show loading if no cache
        setLoading(true)
      }
    } else {
      setLoading(true)
    }

    try {
      const newsRef = collection(db, "artifacts/default-app-id/news")
      const now = Timestamp.now()

      let constraints: QueryConstraint[] = [
        orderBy("createdAt", "desc"),
        limit(NEWS_LOAD_LIMIT)
      ]

      if (categoryFilter !== "all") {
        constraints = [
          where("category", "==", categoryFilter),
          orderBy("createdAt", "desc"),
          limit(NEWS_LOAD_LIMIT)
        ]
      }

      if (!isInitial && lastVisible) {
        // Use createdAt for cursor
        const cursor = typeof lastVisible === 'string' ? Timestamp.fromDate(new Date(lastVisible)) : lastVisible
        constraints.push(startAfter(cursor))
      }

      const newsQuery = query(newsRef, ...constraints)
      const snapshot = await getDocs(newsQuery)

      if (snapshot.empty) {
        setHasMore(false)
        setLoading(false)
        return
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1])

      const newNews = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          type: "news" as const,
          ...data,
          image: data.imageUrl || data.image,
          publishedAt: data.scheduledPublish?.toDate?.()?.toISOString() || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }
      })

      setNews(prev => isInitial ? newNews : [...prev, ...newNews])

      // Save to cache if initial and no search
      if (isInitial && !searchTerm) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1]
        const lastDate = lastDoc.data().createdAt ? lastDoc.data().createdAt.toDate().toISOString() : new Date().toISOString()
        saveToCache(cacheKey, {
          data: newNews,
          lastScheduledAt: lastDate // keeping key name for compatibility but storing createdAt
        })
      }

      if (snapshot.docs.length < NEWS_LOAD_LIMIT) {
        setHasMore(false)
      }

    } catch (error) {
      console.error("[v0] Error fetching news:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNews = news.filter((article) => article.title?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-primary" />
            Latest News
          </h1>
          <p className="text-muted-foreground">Latest updates from the world of cinema</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Tollywood">Tollywood</SelectItem>
              <SelectItem value="Bollywood">Bollywood</SelectItem>
              <SelectItem value="Kollywood">Kollywood</SelectItem>
              <SelectItem value="Sandalwood">Sandalwood</SelectItem>
              <SelectItem value="Hollywood">Hollywood</SelectItem>
              <SelectItem value="Mollywood">Mollywood</SelectItem>
              <SelectItem value="Pan India">Pan India</SelectItem>
              <SelectItem value="Sports">Sports</SelectItem>
              <SelectItem value="Cricket">Cricket</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Politics">Politics</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((article, index) => {
            if (filteredNews.length === index + 1) {
              return (
                <div ref={lastNewsElementRef} key={article.id}>
                  <ArticleCard {...article} />
                </div>
              )
            } else {
              return <ArticleCard key={article.id} {...article} />
            }
          })}

          {loading && (
            Array.from({ length: 3 }).map((_, i) => (
              <NewsCardSkeleton key={`skeleton-${i}`} />
            ))
          )}
        </div>

        {!loading && filteredNews.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No news found</p>
          </div>
        )}

        {!hasMore && filteredNews.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            You've reached the end of the news feed.
          </div>
        )}
      </main>
    </div>
  )
}
