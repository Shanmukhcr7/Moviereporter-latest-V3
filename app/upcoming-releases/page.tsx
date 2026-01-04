"use client"

import { useEffect, useState, useRef } from "react"
import { collection, query, orderBy, getDocs, where, deleteDoc, doc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
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
      const now = Timestamp.now()

      // Use Timestamp for query to match Firestore data type
      // We will perform a broad query and filter strictly client-side to handle both String/Timestamp inconsistencies if any exist,
      // but primarily we target Timestamp > Timestamp.

      const moviesRef = collection(db, "artifacts/default-app-id/movies")

      // Try querying with Timestamp first.
      // Note: If you have mixed types (Strings and Timestamps) for releaseDate, you might miss strings here.
      // But typically a "date" field is Timestamp.
      let q = query(
        moviesRef,
        where("releaseDate", ">", Timestamp.now()),
        orderBy("releaseDate", "asc")
      )

      if (industryFilter !== "all") {
        q = query(
          moviesRef,
          where("industry", "==", industryFilter),
          where("releaseDate", ">", Timestamp.now()),
          orderBy("releaseDate", "asc")
        )
      }

      const snapshot = await getDocs(q)

      const moviesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).filter((movie: any) => {
        // 1. Scheduled Check
        if (movie.scheduledAt) {
          const scheduledTime = movie.scheduledAt.seconds ? movie.scheduledAt.seconds * 1000 : 0
          // If scheduledAt is valid and in the future, don't show it logic:
          // "scheduledAt <= now" means "show it if the schedule time has passed".
          // So valid checking is: if (scheduledTime > now) return false;
          if (scheduledTime > Date.now()) return false
        }
        return true
      })

      setAllMovies(moviesData)
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

      <main className="container mx-auto px-4 py-8">
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
