"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, getDocs, where, limit, startAfter, Timestamp, doc, deleteDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MovieCard } from "@/components/movie-card"
import { Search, Tv } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function OTTReleasesPage() {
  const [allMovies, setAllMovies] = useState<any[]>([])
  const [filteredMovies, setFilteredMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [interestedMovies, setInterestedMovies] = useState<string[]>([])
  const [displayCount, setDisplayCount] = useState(12)
  const BATCH_SIZE = 12
  const { user } = useAuth()

  useEffect(() => {
    fetchMovies()
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserInterests()
    } else {
      setInterestedMovies([])
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, platformFilter, allMovies])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const cacheKey = "ott_releases_all"
      const cached = getFromCache<any[]>(cacheKey)
      if (cached) {
        setAllMovies(cached)
        setLoading(false)
        // SWR: Do NOT return here. Continue to fetch fresh data.
      } else {
        setLoading(true)
      }

      const now = Timestamp.now()

      const moviesRef = collection(db, "artifacts/default-app-id/movies")

      // Query: ottPublished == true AND releaseDate <= now, orderBy releaseDate desc
      let q = query(
        moviesRef,
        where("ottPublished", "==", true),
        where("releaseDate", "<=", now),
        orderBy("releaseDate", "desc")
      )

      const snapshot = await getDocs(q)
      const moviesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).map((movie: any) => ({
        ...movie,
        // Normalize dates for cache
        releaseDate: movie.releaseDate?.toDate ? movie.releaseDate.toDate().toISOString() : movie.releaseDate,
        scheduledAt: movie.scheduledAt?.toDate ? movie.scheduledAt.toDate().toISOString() : movie.scheduledAt
      }))

      setAllMovies(moviesData)
      saveToCache(cacheKey, moviesData)
    } catch (error) {
      console.error("Error fetching OTT movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInterests = async () => {
    if (!user) return
    try {
      const interestsRef = collection(db, `artifacts/default-app-id/users/${user.uid}/interests`)
      const snapshot = await getDocs(interestsRef)
      setInterestedMovies(snapshot.docs.map((doc) => doc.id))
    } catch (error) {
      console.error("Error fetching interests:", error)
    }
  }

  const getSafeDate = (dateVal: any): Date | null => {
    if (!dateVal) return null
    if (typeof dateVal?.toDate === 'function') {
      return dateVal.toDate()
    }
    const d = new Date(dateVal)
    return isNaN(d.getTime()) ? null : d
  }



  const applyFilters = () => {
    let result = allMovies

    if (platformFilter !== "all") {
      result = result.filter(movie => {
        const platforms = movie.ottPlatforms || []
        // legacy map uses lower case keys mostly
        return platforms.some((p: string) => p.toLowerCase() === platformFilter)
      })
    }

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase().trim()
      result = result.filter(movie => {
        const titleMatch = movie.title?.toLowerCase().includes(lowerTerm)
        const descMatch = movie.description?.toLowerCase().includes(lowerTerm)

        let genreMatch = false
        if (Array.isArray(movie.genre)) {
          genreMatch = movie.genre.some((g: string) => g.toLowerCase().includes(lowerTerm))
        } else if (typeof movie.genre === 'string') {
          genreMatch = movie.genre.toLowerCase().includes(lowerTerm)
        }

        const castMatch = movie.cast?.some((c: any) => {
          if (typeof c === 'string') return c.toLowerCase().includes(lowerTerm)
          if (typeof c === 'object' && c.name) return c.name.toLowerCase().includes(lowerTerm)
          return false
        })

        return titleMatch || descMatch || genreMatch || castMatch
      })
    }

    setFilteredMovies(result)
    setDisplayCount(BATCH_SIZE)
  }

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + BATCH_SIZE)
  }

  const displayedMovies = filteredMovies.slice(0, displayCount)



  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-8 pb-32">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground flex items-center justify-center gap-3">
          <Tv className="w-8 h-8 text-primary" />
          OTT Releases
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, genre, cast..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="netflix">Netflix</SelectItem>
              <SelectItem value="amazon prime">Amazon Prime</SelectItem>
              <SelectItem value="disney+ hotstar">Disney+ Hotstar</SelectItem>
              <SelectItem value="jio cinema">Jio Cinema</SelectItem>
              <SelectItem value="sony liv">Sony LIV</SelectItem>
              <SelectItem value="zee5">Zee5</SelectItem>
              <SelectItem value="aha">Aha</SelectItem>
              <SelectItem value="sun nxt">Sun NXT</SelectItem>
              <SelectItem value="etv win">ETV Win</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {filteredMovies.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">No OTT releases found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {displayedMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    poster={movie.poster || movie.posterUrl || ""}
                    releaseDate={movie.releaseDate}
                    industry={movie.industry}
                    genre={movie.genre}
                    ottPlatforms={movie.ottPlatforms}
                    enableInterest={true}
                  />
                ))}
              </div>
            )}

            {displayedMovies.length < filteredMovies.length && (
              <div className="flex justify-center mt-8">
                <Button onClick={handleLoadMore} variant="outline">Load More</Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
