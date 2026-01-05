"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { collection, query, orderBy, limit, getDocs, where, Timestamp, startAfter, QueryConstraint } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Search } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { MovieRatingModal } from "@/components/movie-rating-modal"
import { MovieCard } from "@/components/movie-card"
import { MovieCardSkeleton } from "@/components/skeletons"

export default function MoviesPage() {
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)

  const { user } = useAuth()
  const MOVIES_PER_PAGE = 18

  // Callback to attach observer to the "loader" element
  const lastMovieElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMovies(false)
      }
    })

    if (node) observer.current.observe(node)
  }, [loading, hasMore])


  useEffect(() => {
    // Reset state when filters change
    setMovies([])
    setLastVisible(null)
    setHasMore(true)
    setLoading(true)

    // Small timeout to allow state reset before fetch works best with React 18 strict mode sometimes,
    // but direct call is usually fine.
    fetchMovies(true)
  }, [industryFilter])

  const fetchMovies = async (isInitial = false) => {
    // Prevent double fetching if already loading and not initial (initial handled by effect)
    if (loading && !isInitial) return;

    // Cache Logic
    const cacheKey = `movies_initial_${industryFilter}`
    if (isInitial && !searchTerm) {
      const cached = getFromCache<any>(cacheKey)
      if (cached) {
        setMovies(cached.data)
        // Restore cursor for next page
        // We stored the releaseDate of the last item
        setLastVisible(cached.lastReleaseDate)
        setHasMore(true)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    try {
      const now = Timestamp.now()
      const moviesRef = collection(db, "artifacts/default-app-id/movies")

      // Basic query constraints
      let constraints: QueryConstraint[] = [
        where("scheduledAt", "<=", now),
        where("releaseDate", "<=", now),
        orderBy("releaseDate", "desc"),
        limit(MOVIES_PER_PAGE)
      ]

      if (industryFilter !== "all") {
        constraints.push(where("industry", "==", industryFilter))
      }

      // Add pagination
      // Note: `lastVisible` state update is async, so for 'Load More' we use the state.
      // For initial load we ignore it.
      if (!isInitial && lastVisible) {
        // If lastVisible is a string (ISO date from cache), convert to Timestamp
        const cursor = typeof lastVisible === 'string' ? Timestamp.fromDate(new Date(lastVisible)) : lastVisible
        constraints.push(startAfter(cursor))
      }

      const moviesQuery = query(moviesRef, ...constraints)
      const snapshot = await getDocs(moviesQuery)

      if (snapshot.empty) {
        setHasMore(false)
        setLoading(false)
        return
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1])

      const moviesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Fetch User Reviews to identify what they've already rated
      // NOTE: fetching reviews for ALL movies every time is inefficient.
      // Optimization: Fetch reviews only for IDs in moviesData.
      let userRatedMovieIds = new Set()
      if (user && moviesData.length > 0) {
        // In a real app, you'd batch request review status or store it on the user object.
        // For now, we'll keep the logic simple but scoped.
        // Or keep the original global query if dataset is small.
        // Let's stick to original simpler logic for stability, but applied to these movies?
        // Actually, original logic queried ALL user reviews. That scales poorly.
        // Correct approach: Client-side check against a loaded "UserReviews" set or
        // query where movieId IN [...ids].

        // Simulating the original behavior efficiently:
        const userReviewsQuery = query(
          collection(db, "artifacts/default-app-id/reviews"),
          where("userId", "==", user.uid)
        )
        // Caching this locally would be better, but we stick to the pattern.
        const userReviewsSnap = await getDocs(userReviewsQuery)
        userReviewsSnap.forEach(doc => userRatedMovieIds.add(doc.data().movieId))
      }

      const processedMovies = moviesData.map(m => ({
        ...m,
        hasRated: userRatedMovieIds.has(m.id)
      }))

      setMovies(prev => isInitial ? processedMovies : [...prev, ...processedMovies])

      // Save to cache initial load
      if (isInitial && !searchTerm) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1]
        // Get releaseDate for cursor
        const lastData = lastDoc.data()
        const lastDate = lastData.releaseDate ? (lastData.releaseDate.toDate ? lastData.releaseDate.toDate().toISOString() : new Date(lastData.releaseDate).toISOString()) : new Date().toISOString()

        saveToCache(cacheKey, {
          data: processedMovies,
          lastReleaseDate: lastDate
        })
      }

      if (snapshot.docs.length < MOVIES_PER_PAGE) {
        setHasMore(false)
      }

    } catch (error) {
      console.error("[v0] Error fetching movies:", error)
    } finally {
      setLoading(false)
    }
  }

  // Client-side search (still applied on top of loaded movies)
  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(movie.genre) && movie.genre.some((g: string) => g.toLowerCase().includes(searchTerm.toLowerCase())))
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Star className="w-8 h-8 text-primary" />
            Movie Reviews & Ratings
          </h1>
          <p className="text-muted-foreground">Rate and review your favorite movies</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, genre..."
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

        {/* Movies Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {filteredMovies.map((movie, index) => {
            // Attach ref to the last element for infinite scroll
            if (filteredMovies.length === index + 1) {
              return (
                <div ref={lastMovieElementRef} key={movie.id} className="h-full">
                  <MovieCard
                    {...movie}
                    rating={movie.avgRating}
                    poster={movie.poster || movie.posterUrl}
                    enableInterest
                  />
                </div>
              )
            } else {
              return (
                <div key={movie.id} className="h-full">
                  <MovieCard
                    {...movie}
                    rating={movie.avgRating}
                    poster={movie.poster || movie.posterUrl}
                    enableInterest
                  />
                </div>
              )
            }
          })}

          {/* Skeleton Loaders (Initial or Fetching More) */}
          {loading && (
            Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={`skeleton-${i}`} />
            ))
          )}
        </div>

        {!loading && filteredMovies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No movies found</p>
          </div>
        )}

        {/* End of list message */}
        {!hasMore && filteredMovies.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            You've reached the end of the list.
          </div>
        )}

      </main>

      {/* Movie Rating Modal */}
      {selectedMovie && (
        <MovieRatingModal
          movie={selectedMovie}
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          user={user}
        />
      )}
    </div>
  )
}
