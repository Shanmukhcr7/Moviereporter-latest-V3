"use client"

import { useEffect, useState, useRef } from "react"
import { collection, query, orderBy, getDocs, where, deleteDoc, doc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function UpcomingReleasesPage() {
  const [allMovies, setAllMovies] = useState<any[]>([])
  const [filteredMovies, setFilteredMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [interestedMovies, setInterestedMovies] = useState<string[]>([])
  const [displayCount, setDisplayCount] = useState(10)
  const BATCH_SIZE = 10
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
  }, [searchTerm, industryFilter, allMovies])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const cacheKey = "upcoming_releases_all"

      // Only check cache if no industry filter is applied initially? 
      // Actually the function fetches ALL matching the query constraints. 
      // The query constraints USE `industryFilter`.
      // If `industryFilter` changes, `fetchMovies` is NOT called automatically?
      // Wait, `useEffect(() => { fetchMovies() }, [])` only runs once.
      // `applyFilters` runs on `allMovies` change.
      // BUT `fetchMovies` uses `industryFilter` state variable inside its body?
      // Ah, looking at the code: `if (industryFilter !== "all") { ... }` inside `fetchMovies`.
      // BUT `fetchMovies` is ONLY called on mount `useEffect(..., [])`.
      // So on mount, `industryFilter` is "all".
      // Wait, if `industryFilter` changes, does `fetchMovies` run? 
      // The `useEffect` dependency array is empty `[]`.
      // So `fetchMovies` ONLY runs once with default "all".
      // Then `applyFilters` runs when `industryFilter` changes, filtering the `allMovies` client-side?
      // Wait, line 149: `if (industryFilter !== "all") result = result.filter(...)`
      // So filtering IS client side.
      // BUT `fetchMovies` ALSO has a query with `industryFilter`?
      // Lines 65-72 in original code:
      // `if (industryFilter !== "all") { q = query(..., where("industry", "==", industryFilter) ...)`
      // This logic inside `fetchMovies` is effectively dead code or misleading if `fetchMovies` is only called once on mount!
      // Unless the user changed the code to call `fetchMovies` on filter change?
      // No, line 30: `useEffect(() => { fetchMovies() }, [])`.
      // So `fetchMovies` fetches EVERYTHING (since default is "all") once.
      // Then `applyFilters` filters it.
      // So we can safely cache the "all" result.

      const cached = getFromCache<any[]>(cacheKey)
      if (cached) {
        setAllMovies(cached)
        setLoading(false)
        return
      }

      const now = Timestamp.now()
      const moviesRef = collection(db, "artifacts/default-app-id/movies")

      // Fetch all upcoming movies
      const q = query(
        moviesRef,
        where("releaseDate", ">", Timestamp.now()),
        orderBy("releaseDate", "asc")
      )

      const snapshot = await getDocs(q)

      const moviesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).filter((movie: any) => {
        if (movie.scheduledAt) {
          const scheduledTime = movie.scheduledAt.seconds ? movie.scheduledAt.seconds * 1000 : 0
          if (scheduledTime > Date.now()) return false
        }
        return true
      })

      // Serialize dates for cache (Firestore timestamps don't survive JSON stringify well, usually turn to objects)
      // When reading back, we might need to handle them. 
      // The code uses `getSafeDate` which handles `dateVal?.toDate` OR `new Date(dateVal)`.
      // So if we save as ISO strings or just plain objects, `new Date` should handle it.
      // `Timestamp` objects when JSON stringified often become `{seconds:..., nanoseconds:...}`.
      // `getSafeDate` expects `toDate()` method existence or string. 
      // The vanilla JSON object won't have `toDate()`.
      // So we should map them to ISO strings?
      // The `allMovies` state is used. `filteredMovies` is derived.
      // `getSafeDate` (line 184) checks `toDate` function.
      // If we restore from cache, it won't have `toDate`.
      // So `new Date(dateVal)` will be called.
      // JSON.stringify of a Timestamp object: `{"seconds":..., "nanoseconds":...}`.
      // `new Date({...})` results in Invalid Date usually.
      // So we MUST convert Timestamps to Strings or Numbers before caching if we want `getSafeDate` to work with `new Date()`.
      // OR we update `getSafeDate` to handle the shape.
      // Better to normalize data to primitives before caching.

      const normalizedMovies = moviesData.map((m: any) => ({
        ...m,
        // Normalize dates for cache
        releaseDate: m.releaseDate?.toDate ? m.releaseDate.toDate().toISOString() : m.releaseDate,
        scheduledAt: m.scheduledAt?.toDate ? m.scheduledAt.toDate().toISOString() : m.scheduledAt
      }))

      setAllMovies(normalizedMovies)
      saveToCache(cacheKey, normalizedMovies)

    } catch (error) {
      console.error("Error fetching movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInterests = async () => {
    if (!user) return
    try {
      // Correct Path: artifacts/default-app-id/users/{uid}/interests
      const interestsRef = collection(db, `artifacts/default-app-id/users/${user.uid}/interests`)
      const snapshot = await getDocs(interestsRef)
      setInterestedMovies(snapshot.docs.map((doc) => doc.id)) // Doc ID is usually movieId
    } catch (error) {
      console.error("Error fetching interests:", error)
    }
  }

  const handleInterest = async (e: React.MouseEvent, movie: any) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.info("Please login to save interest")
      return
    }

    const movieId = movie.id
    try {
      const docRef = doc(db, `artifacts/default-app-id/users/${user.uid}/interests/${movieId}`)

      if (interestedMovies.includes(movieId)) {
        await deleteDoc(docRef)
        setInterestedMovies(prev => prev.filter(id => id !== movieId))
        toast.info("Removed from interests")
      } else {
        const safeDate = getSafeDate(movie.releaseDate)
        await setDoc(docRef, {
          movieId,
          title: movie.title,
          posterUrl: movie.posterUrl || movie.poster || "",
          releaseDate: safeDate ? Timestamp.fromDate(safeDate) : null,
          addedAt: Timestamp.now()
        })
        setInterestedMovies(prev => [...prev, movieId])
        toast.success("Added to interests")
      }
    } catch (error) {
      console.error("Error handling interest:", error)
      toast.error("Failed to update interest")
    }
  }

  const applyFilters = () => {
    let result = allMovies

    if (industryFilter !== "all") {
      result = result.filter(movie => movie.industry === industryFilter)
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

  const getSafeDate = (dateVal: any): Date | null => {
    if (!dateVal) return null
    if (typeof dateVal?.toDate === 'function') {
      return dateVal.toDate()
    }
    const d = new Date(dateVal)
    return isNaN(d.getTime()) ? null : d
  }

  const getCountdown = (releaseDate: any) => {
    const release = getSafeDate(releaseDate)
    if (!release) return ""

    const now = new Date()
    const diff = release.getTime() - now.getTime()
    if (diff <= 0) return "Released!"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return `${days}d ${hours}h`
  }

  const displayedMovies = filteredMovies.slice(0, displayCount)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-8 pb-32">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground flex items-center justify-center gap-3">
          <Calendar className="w-8 h-8 text-primary" />
          Upcoming Releases
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
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {filteredMovies.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">No upcoming movies found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {displayedMovies.map((movie) => {
                  const releaseDateObj = getSafeDate(movie.releaseDate)
                  return (
                    <Card
                      key={movie.id}
                      className="group h-full overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur relative flex flex-col"
                    >
                      <Link href={`/movie/${movie.id}`} className="flex-1">
                        <div className="relative aspect-[2/3] overflow-hidden">
                          <Image
                            src={movie.poster || movie.posterUrl || "/placeholder.svg"}
                            alt={movie.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {movie.industry && (
                            <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur">{movie.industry}</Badge>
                          )}
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white">
                            {getCountdown(movie.releaseDate)}
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-2">
                          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{movie.title}</h3>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{releaseDateObj ? releaseDateObj.toLocaleDateString() : 'TBD'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Link>

                      {/* Interest Button moved to bottom for better layout in dense grid */}
                      <div className="p-4 pt-0 mt-auto">
                        <Button
                          variant={interestedMovies.includes(movie.id) ? "default" : "outline"}
                          size="sm"
                          className="w-full gap-2 z-20 relative"
                          onClick={(e) => handleInterest(e, movie)}
                        >
                          <Heart
                            className={`h-4 w-4 ${interestedMovies.includes(movie.id) ? "fill-current" : ""}`}
                          />
                          {interestedMovies.includes(movie.id) ? "Interested" : "I'm Interested"}
                        </Button>
                      </div>
                    </Card>
                  )
                })}
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
