"use client"

import { useEffect, useState, useRef } from "react"
import { collection, query, orderBy, getDocs, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { MovieCard } from "@/components/movie-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, TrendingUp, Loader2 } from "lucide-react"

export default function TopBoxOfficePage() {
  const [allMovies, setAllMovies] = useState<any[]>([])
  const [filteredMovies, setFilteredMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")

  // Pagination
  const [displayCount, setDisplayCount] = useState(12)
  const BATCH_SIZE = 12

  useEffect(() => {
    fetchMovies()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, industryFilter, allMovies])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const cacheKey = "top_boxoffice_movies"
      const cached = getFromCache<any[]>(cacheKey)
      if (cached) {
        setAllMovies(cached)
        setLoading(false)
        return
      }

      // Legacy Logic: Fetch scheduled movies, then filter for (isPopular || isTopBoxOffice)
      const now = Timestamp.now()

      // We try to match legacy query: where scheduledAt <= now, orderBy releaseDate desc
      // Note: This requires a composite index. If it fails, we might need to fallback.
      // Given the user likely has legacy indexes, we'll try the optimal way first, 
      // but if we see errors, we might need to fetch all and filter 'scheduledAt' client side.
      // For safety and broader compatibility as seen in other pages, let's fetch by releaseDate 
      // and filter scheduledAt client side if needed, or use the direct query if we are confident.
      // User legacy code: query(moviesRef, where('scheduledAt', '<=', now), orderBy('releaseDate', 'desc'));

      const moviesRef = collection(db, "artifacts/default-app-id/movies")
      let q = query(moviesRef, where('scheduledAt', '<=', now), orderBy('releaseDate', 'desc'))

      let snapshot
      try {
        snapshot = await getDocs(q)
      } catch (e) {
        console.warn("Index missing for scheduledAt+releaseDate, fetching all by releaseDate")
        q = query(moviesRef, orderBy('releaseDate', 'desc'))
        snapshot = await getDocs(q)
      }

      const moviesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).filter((movie: any) => {
        // 1. Scheduled Check (redundant if query worked, but safe)
        if (movie.scheduledAt) {
          const scheduledTime = movie.scheduledAt.seconds ? movie.scheduledAt.seconds * 1000 : 0
          if (scheduledTime > Date.now()) return false
        }

        // 2. Legacy Filter: isPopular OR isTopBoxOffice
        return movie.isPopular === true || movie.isTopBoxOffice === true
      })
        .map((movie: any) => ({
          ...movie,
          // Normalize dates for cache
          releaseDate: movie.releaseDate?.toDate ? movie.releaseDate.toDate().toISOString() : movie.releaseDate,
          scheduledAt: movie.scheduledAt?.toDate ? movie.scheduledAt.toDate().toISOString() : movie.scheduledAt
        }))

      setAllMovies(moviesData)
      saveToCache(cacheKey, moviesData)
    } catch (error) {
      console.error("Error fetching top movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = allMovies

    // Industry Filter
    if (industryFilter !== "all") {
      result = result.filter(movie => movie.industry === industryFilter)
    }

    // Search Filter (Deep Search)
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase().trim()
      result = result.filter(movie => {
        const titleMatch = movie.title?.toLowerCase().includes(lowerTerm)

        // Handle Genre (Array or String)
        let genreMatch = false
        if (Array.isArray(movie.genre)) {
          genreMatch = movie.genre.some((g: string) => g.toLowerCase().includes(lowerTerm))
        } else if (typeof movie.genre === 'string') {
          genreMatch = movie.genre.toLowerCase().includes(lowerTerm)
        }

        const descMatch = movie.description?.toLowerCase().includes(lowerTerm)

        // Handle Cast (Array of objects or strings)
        const castMatch = movie.cast?.some((c: any) => {
          if (typeof c === 'string') return c.toLowerCase().includes(lowerTerm)
          if (typeof c === 'object' && c.name) return c.name.toLowerCase().includes(lowerTerm)
          return false
        })

        return titleMatch || genreMatch || descMatch || castMatch
      })
    }

    setFilteredMovies(result)
    setDisplayCount(BATCH_SIZE) // Reset pagination on filter change
  }

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + BATCH_SIZE)
  }

  const displayedMovies = filteredMovies.slice(0, displayCount)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, genre, cast..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="Tollywood">Tollywood</SelectItem>
              <SelectItem value="Bollywood">Bollywood</SelectItem>
              <SelectItem value="Kollywood">Kollywood</SelectItem>
              <SelectItem value="Sandalwood">Sandalwood</SelectItem>
              <SelectItem value="Hollywood">Hollywood</SelectItem>
              <SelectItem value="Mollywood">Mollywood</SelectItem>
              <SelectItem value="Pan India">Pan India</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {filteredMovies.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">No movies found matching your criteria.</p>
                <Button
                  variant="link"
                  onClick={() => { setSearchTerm(''); setIndustryFilter('all') }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {displayedMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    {...movie}
                    poster={movie.posterUrl || movie.poster || ""}
                    releaseDate={movie.releaseDate ? (movie.releaseDate.toDate ? movie.releaseDate.toDate().toISOString() : movie.releaseDate) : ""}
                    isTopBoxOffice={movie.isTopBoxOffice}
                    isPopular={movie.isPopular}
                  />
                ))}
              </div>
            )}

            {displayedMovies.length < filteredMovies.length && (
              <div className="flex justify-center mt-12">
                <Button onClick={handleLoadMore} size="lg" className="px-8">
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
