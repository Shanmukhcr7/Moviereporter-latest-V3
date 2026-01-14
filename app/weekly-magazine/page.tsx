"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { ArticleCard } from "@/components/article-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookMarked } from "lucide-react"

export default function WeeklyMagazinePage() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchMagazineArticles()
  }, [categoryFilter])

  const fetchMagazineArticles = async () => {
    setLoading(true)
    try {
      let newsQuery = query(
        collection(db, "artifacts/default-app-id/news"),
        where("isWeeklyMagazine", "==", true),
        limit(50),
      )

      if (categoryFilter !== "all") {
        newsQuery = query(
          collection(db, "artifacts/default-app-id/news"),
          where("isWeeklyMagazine", "==", true),
          where("category", "==", categoryFilter),
          limit(50),
        )
      }

      const snapshot = await getDocs(newsQuery)


      const curr = new Date()
      const day = curr.getDay()
      const diff = curr.getDate() - day

      const sundayStart = new Date(curr.setDate(diff))
      sundayStart.setHours(0, 0, 0, 0)
      const sundayStartMillis = sundayStart.getTime()

      const processDocs = snapshot.docs.map((doc) => {
        const d = doc.data()
        const dateVal = d.publishedAt || d.scheduledAt || d.createdAt
        let millis = 0
        if (dateVal?.toMillis) millis = dateVal.toMillis()
        else if (dateVal?.seconds) millis = dateVal.seconds * 1000
        else millis = new Date(dateVal || 0).getTime()

        return {
          id: doc.id,
          type: "news" as const,
          ...d,
          image: d.image || d.imageUrl || d.bannerImage || d.bannerImageUrl || "",
          publishedAt: new Date(millis).toISOString(),
          _millis: millis // temp for sorting/filtering
        }
      })

      const filtered = processDocs
        .filter(doc => doc._millis >= sundayStartMillis)
        .sort((a, b) => b._millis - a._millis)

      setArticles(filtered)
    } catch (error) {
      console.error("[v0] Error fetching magazine articles:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[250px]">
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

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-video bg-muted animate-pulse rounded-lg" />
            ))
            : articles.map((article) => <ArticleCard key={article.id} {...article} />)}
        </div>

        {!loading && articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No magazine articles this week</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" size="lg">
              Load More
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
