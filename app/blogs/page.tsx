"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs, Timestamp, where, startAfter } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { ArticleCard } from "@/components/article-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const BLOGS_LOAD_LIMIT = 12

  useEffect(() => {
    fetchBlogs(true)
  }, [])

  const fetchBlogs = async (isInitial = false) => {
    // Cache Check
    const cacheKey = "blogs_initial_list"
    if (isInitial && !searchTerm) {
      const cached = getFromCache<any>(cacheKey)
      if (cached) {
        setBlogs(cached.data)
        setLastVisible(cached.lastDate)
        setLoading(false)
        // SWR: Do NOT return here. Continue to fetch fresh data.
      } else {
        setLoading(true)
      }
    } else {
      setLoading(true)
    }
    try {
      const blogsRef = collection(db, "artifacts/default-app-id/blogs")
      const now = Timestamp.now()

      let constraints: any[] = [
        orderBy("createdAt", "desc"),
        limit(BLOGS_LOAD_LIMIT)
      ]

      if (!isInitial && lastVisible) {
        // If lastVisible is a string (ISO date set from cache restoration), convert to Timestamp
        const cursor = typeof lastVisible === 'string' ? Timestamp.fromDate(new Date(lastVisible)) : lastVisible
        constraints.push(startAfter(cursor))
      }

      const blogsQuery = query(blogsRef, ...constraints)
      const snapshot = await getDocs(blogsQuery)

      if (snapshot.empty) {
        setHasMore(false)
      } else {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1])
        const newBlogs = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            type: "blog" as const, // Consistently use "blog" type
            ...data,
            image: data.imageUrl || data.image, // Handle legacy imageUrl
            publishedAt: data.scheduledAt ? data.scheduledAt.toDate().toISOString() : (data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()),
            excerpt: data.excerpt || data.description || data.summary || (data.content ? data.content.substring(0, 100) + "..." : "Read article for more details")
          }
        })

        setBlogs(prev => isInitial ? newBlogs : [...prev, ...newBlogs])

        // Save to cache (Initial only)
        if (isInitial && !searchTerm && newBlogs.length > 0) {
          const lastDoc = snapshot.docs[snapshot.docs.length - 1]
          const lastDate = lastDoc.data().createdAt ? lastDoc.data().createdAt.toDate().toISOString() : new Date().toISOString()
          saveToCache(cacheKey, {
            data: newBlogs,
            lastDate: lastDate
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching blogs:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBlogs = blogs.filter((blog) => blog.title?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Latest Blogs</h1>
          <p className="text-muted-foreground text-lg">Deep dives, reviews, and insights into the movie world</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>

        {/* Blogs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.length === 0 && loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video bg-muted animate-pulse rounded-lg" />
            ))
            : filteredBlogs.map((blog) => <ArticleCard key={blog.id} {...blog} />)}
        </div>

        {!loading && filteredBlogs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No blogs found</p>
          </div>
        )}

        {hasMore && filteredBlogs.length > 0 && (
          <div className="flex justify-center mt-12">
            <Button variant="outline" size="lg" onClick={() => fetchBlogs(false)} disabled={loading}>
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
