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

    if (isInitial && !searchTerm) {
      const cached = getFromCache<any>(cacheKey)
      if (cached) {
        setNews(cached.docs)
        setLastVisible(null) // Pagination link broken for cached data unless we serialize it? 
        // Firestore QueryDocumentSnapshot cannot be easily serialized/deserialized for pagination use.
        // If we use cache, we lose pagination capability for the "next" page unless we fetch it.
        // But the user asked to remove reads.
        // If we show cached data, we can't easily "Load More" from where we left off without a real snapshot.
        // Strategy: Use cache for display. If user scrolls to bottom, we might need to reset/refetch or use a timestamp cursor?
        // Actually, we can use `startAfter` with a serialized date if we sort by date. 
        // The current code uses `startAfter(lastVisible)` which is a doc snapshot.
        // We can switch to `startAfter(timestamp)` for easier restoration.
        // Modification: Switch query to use timestamp cursor if possible?
        // Existing query: orderBy("scheduledAt", "desc")
        // So we can use the last item's `scheduledAt` for cursor.

        // Let's proceed with caching the list data. If user hits bottom, we can't easily continue from cache without a real doc.
        // We'll set hasMore=false for cached data to be safe, OR we assume cache is only for "fresh visit" and force refresh on load more?
        // Better: If cached, show it. If they want more, we might need to re-fetch the first batch + next batch or just fail over.
        // Let's keep it simple: Cache initial view. If they scroll, we might re-fetch from scratch or handle it gracefully.
        // The simplest approach that meets the "reduce reads" requirement:
        // Cache the initial 12 items.
        // If cached data is used, `lastVisible` is null.
        // If user scrolls, `fetchNews(false)` is called.
        // logic: `if (!isInitial && lastVisible)`. If lastVisible is null, it won't add startAfter, so it fetches page 1 again? 
        // That would duplicate. 
        // We need to be careful.

        // Alternative: Don't cache pagination state. Just cache the content for "quick view". 
        // If they interact, maybe we trigger a real fetch?
        // Or we store the last item's timestamp and use it for `startAfter`.

        // Let's refine:
        // 1. Cache the `newNews` array.
        // 2. On mount, load from cache.
        // 3. For pagination to work, we need a valid cursor. Since we can't cache the Firestore object, we might have to disable "Load More" until they refresh?
        // OR: We store the serialized data. When "Load More" triggers, we fetch using the `publishedAt` of the last item as the cursor (using startAfter(date)).

        setNews(cached.data)
        const lastItem = cached.data[cached.data.length - 1]
        // We need to re-construct a "fake" cursor or use field-based cursor
        // Firestore allows `startAfter(fieldValue)`.
        // Our sort is `orderBy("scheduledAt", "desc")`.
        // So we can use the string timestamp or date object.
        // cached.lastScheduledAt would be useful.
        setLastVisible(cached.lastScheduledAt)
        setHasMore(true)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    try {
      const newsRef = collection(db, "artifacts/default-app-id/news")
      const now = Timestamp.now()

      let constraints: QueryConstraint[] = [
        where("scheduledAt", "<=", now),
        orderBy("scheduledAt", "desc"),
        limit(NEWS_LOAD_LIMIT)
      ]

      if (categoryFilter !== "all") {
        // Note: Ensure Firestore composite index exists for category + scheduledAt
        constraints = [
          where("scheduledAt", "<=", now),
          where("category", "==", categoryFilter),
          orderBy("scheduledAt", "desc"),
          limit(NEWS_LOAD_LIMIT)
        ]
      }

      if (!isInitial && lastVisible) {
        // If lastVisible is a string (timestamp from cache), convert to Date/Timestamp?
        // Actually startAfter accepts variadic args. 
        // If it's a doc snapshot, fine. If it's a date, fine.
        // We need to ensure we pass the right type.
        // Our sort is by `scheduledAt`.
        // If lastVisible is a string ISO, we might need to convert to Timestamp or Date.
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

      // If we used a cursor, we aren't getting a snapshot back that we can cache effectively as a cursor for the NEXT batch if we mix types.
      // But for the current batch, we have snapshot.docs.
      setLastVisible(snapshot.docs[snapshot.docs.length - 1])

      const newNews = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          type: "news" as const,
          ...data,
          image: data.imageUrl || data.image,
          publishedAt: data.scheduledAt ? data.scheduledAt.toDate().toISOString() : new Date().toISOString()
        }
      })

      setNews(prev => isInitial ? newNews : [...prev, ...newNews])

      // Save to cache if initial and no search
      if (isInitial && !searchTerm) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1]
        const lastDate = lastDoc.data().scheduledAt ? lastDoc.data().scheduledAt.toDate().toISOString() : new Date().toISOString()
        saveToCache(cacheKey, {
          data: newNews,
          lastScheduledAt: lastDate
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
