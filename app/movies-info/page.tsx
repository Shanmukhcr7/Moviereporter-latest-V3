"use client"

import { useEffect, useState, useRef } from "react"
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { MovieCard } from "@/components/movie-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface Movie {
  id: string
  title: string
  posterUrl?: string
  poster?: string // Fallback
  releaseDate?: any
  genre?: string | string[]
  industry?: string
  description?: string
  cast?: any[]
  [key: string]: any
}

const BATCH_SIZE = 6

export default function MoviesInfoPage() {
  const [allMovies, setAllMovies] = useState<Movie[]>([])
  const [displayedMovies, setDisplayedMovies] = useState<Movie[]>([]) // Filtered list
  const [visibleMovies, setVisibleMovies] = useState<Movie[]>([]) // Rendered batch
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [currentIndex, setCurrentIndex] = useState(0)

  // Debounce ref
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadMovies()
  }, [])

  useEffect(() => {
    handleSearchAndFilter()
  }, [industryFilter, allMovies])

  // Debounce search input
  const handleSearchInput = (value: string) => {
    setSearchTerm(value)
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)

    debounceTimeout.current = setTimeout(() => {
      applyFilters(value, industryFilter)
    }, 300)
  }

  const loadMovies = async () => {
    setLoading(true)
    try {
      const cacheKey = "movies_info_all"
      const cached = getFromCache<Movie[]>(cacheKey)
      if (cached) {
        setAllMovies(cached)
        setLoading(false)
        // SWR: Do NOT return. Fetch fresh data.
      } else {
        setLoading(true)
      }

      const moviesRef = collection(db, "artifacts/default-app-id/movies")
      // Fetch larger set or all, then filter dates client side to be safe against index issues
      // Legacy used: where('scheduledAt', '<=', now), where('releaseDate', '<=', now), orderBy('releaseDate', 'desc')
      // We will try to fetch ordered by releaseDate. If index error matches, we might need to fetch all and sort client side.
      // Let's try simple fetch of recent movies first, or just fetch all for client-side search since legacy did 'allMoviesData = []'

      const q = query(moviesRef, orderBy("releaseDate", "desc"))
      const snapshot = await getDocs(q)

      const now = new Date().getTime()

      const validMovies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movie))
        .filter(movie => {
          // Client-side date check
          const getMillis = (d: any) => {
            if (!d) return 0
            if (d.seconds) return d.seconds * 1000
            if (typeof d === 'string') return new Date(d).getTime()
            if (d.toDate) return d.toDate().getTime()
            return 0
          }
          const release = getMillis(movie.releaseDate)
          return release > 0 && release <= now
        })
        .map(movie => ({
          ...movie,
          // Normalize dates for cache
          releaseDate: movie.releaseDate?.toDate ? movie.releaseDate.toDate().toISOString() : movie.releaseDate
        }))

      setAllMovies(validMovies)
      saveToCache(cacheKey, validMovies)
      // Initial filter application will happen via useEffect -> applyFilters
    } catch (error) {
      console.error("Error loading movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (search: string, industry: string) => {
    let filtered = allMovies

    // Industry Filter
    if (industry !== 'all') {
      filtered = filtered.filter(m => m.industry === industry)
    }

    // Search Filter
    const term = search.toLowerCase().trim()
    if (term) {
      filtered = filtered.filter(movie => {
        const title = movie.title?.toLowerCase() || ""
        const desc = movie.description?.toLowerCase() || ""

        // Genre check
        const genre = Array.isArray(movie.genre)
          ? movie.genre.join(" ").toLowerCase()
          : (movie.genre || "").toLowerCase()

        // Cast check
        const castMatch = Array.isArray(movie.cast) && movie.cast.some(c => {
          if (typeof c === 'string') return c.toLowerCase().includes(term)
          if (c && typeof c === 'object' && c.name) return c.name.toLowerCase().includes(term)
          return false
        })

        return title.includes(term) || desc.includes(term) || genre.includes(term) || castMatch
      })
    }

    setDisplayedMovies(filtered)
    setCurrentIndex(0)
    setVisibleMovies(filtered.slice(0, BATCH_SIZE))
    setCurrentIndex(BATCH_SIZE)
  }

  // Call applyFilters when dependencies change is handled by useEffect slightly differently to avoid loop
  // The useEffect calls 'handleSearchAndFilter' which calls 'applyFilters' with current state
  const handleSearchAndFilter = () => {
    applyFilters(searchTerm, industryFilter)
  }

  const loadMore = () => {
    const nextBatch = displayedMovies.slice(currentIndex, currentIndex + BATCH_SIZE)
    setVisibleMovies(prev => [...prev, ...nextBatch])
    setCurrentIndex(prev => prev + BATCH_SIZE)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-8 pb-32">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Movies Info</h1>
          <p className="text-muted-foreground">Explore all released movies</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, genre, cast..."
              value={searchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
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

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : visibleMovies.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed">
            <p className="text-muted-foreground">No movies found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {visibleMovies.map(movie => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                poster={movie.posterUrl || movie.poster || ""}
                releaseDate={movie.releaseDate ? (movie.releaseDate.toDate ? movie.releaseDate.toDate().toISOString() : movie.releaseDate) : ""}
                industry={movie.industry}
                genre={movie.genre}
                ottPlatforms={undefined}
              // Legacy doesn't show rating in this list, but we can if available
              // rating={movie.avgRating} 
              />
            ))}
          </div>
        )}

        {!loading && visibleMovies.length < displayedMovies.length && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={loadMore}>Load More</Button>
          </div>
        )}
      </main>
    </div>
  )
}
