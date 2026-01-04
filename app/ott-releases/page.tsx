"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, getDocs, where, limit, startAfter, Timestamp, doc, deleteDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Tv, Heart, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
      const now = Timestamp.now()

      const moviesRef = collection(db, "artifacts/default-app-id/movies")

      // Query: ottPublished == true AND scheduledAt <= now, orderBy scheduledAt desc
      let q = query(
        moviesRef,
        where("ottPublished", "==", true),
        // We filter scheduledAt client side if index issues arise, but let's try strict matching first 
        // similar to legacy: where('scheduledAt', '<=', now), orderBy('scheduledAt', 'desc')
        where("scheduledAt", "<=", now),
        orderBy("scheduledAt", "desc")
      )

      const snapshot = await getDocs(q)
      const moviesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setAllMovies(moviesData)
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

  // Platform badges helper
  const ottPlatformImages: Record<string, string> = {
    "amazon prime": "/assets/ott/prime.webp",
    "netflix": "/assets/ott/netflix.webp",
    "youtube": "/assets/ott/youtube.webp",
    "jio hotstar": "/assets/ott/hotstar.webp",
    "disney+ hotstar": "/assets/ott/hotstar.webp",
    "sony liv": "/assets/ott/sonyliv.webp",
    "sun nxt": "/assets/ott/sunnxt.webp",
    "zee tv": "/assets/ott/zeetv.webp",
    "zee5": "/assets/ott/zeetv.webp",
    "etv win": "/assets/ott/etv.webp",
    "etv1": "/assets/ott/etv.webp",
    "aha": "/assets/ott/aha.webp",
    "jio cinema": "/assets/ott/jiocinema.webp",
    "mx player": "/assets/ott/mx-player.webp",
  }

  const renderPlatforms = (platforms: string[]) => {
    if (!platforms || platforms.length === 0) return null
    const maxShow = 3
    const show = platforms.slice(0, maxShow)
    const more = platforms.length - maxShow

    return (
      <div className="flex items-center gap-2 mt-2">
        {show.map((p, i) => {
          const key = p.toLowerCase()
          const iconSrc = ottPlatformImages[key]

          if (iconSrc) {
            return (
              <div key={i} className="relative w-6 h-6 rounded-full overflow-hidden border border-border/50 bg-background" title={p}>
                <Image src={iconSrc} alt={p} fill className="object-cover" />
              </div>
            )
          }
          return (
            <Badge key={i} variant="secondary" className="text-[10px] px-1 h-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {p}
            </Badge>
          )
        })}
        {more > 0 && (
          <Badge variant="outline" className="text-[10px] px-1 h-5 rounded-full flex items-center justify-center">+{more}</Badge>
        )}
      </div>
    )
  }

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
                {displayedMovies.map((movie) => {
                  const releaseDateObj = getSafeDate(movie.releaseDate)
                  return (
                    <Link key={movie.id} href={`/movie/${movie.id}`}>
                      <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur flex flex-col relative">
                        <div className="relative aspect-[2/3] overflow-hidden">
                          <Image
                            src={movie.poster || movie.posterUrl || "/placeholder.svg"}
                            alt={movie.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {movie.industry && (
                            <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur text-[10px] px-1.5 h-5">{movie.industry}</Badge>
                          )}
                        </div>
                        <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{movie.title}</h3>

                          <div className="text-xs text-muted-foreground">
                            {releaseDateObj ? `Released: ${releaseDateObj.toLocaleDateString()}` : 'Date: N/A'}
                          </div>

                          {/* OTT Platforms Section */}
                          <div className="mt-auto pt-2 border-t border-border/50">
                            {renderPlatforms(movie.ottPlatforms)}
                          </div>
                        </CardContent>

                        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            size="icon"
                            variant="secondary"
                            className={`h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur ${interestedMovies.includes(movie.id) ? "text-red-500 opacity-100" : "text-white"}`}
                            onClick={(e) => handleInterest(e, movie)}
                          >
                            <Heart className={`h-3.5 w-3.5 ${interestedMovies.includes(movie.id) ? "fill-current" : ""}`} />
                          </Button>
                        </div>
                        {/* Always show interested button if active, even if not hovering (mobile ux consideration) */}
                        {interestedMovies.includes(movie.id) && (
                          <div className="absolute top-2 right-2 z-20 md:hidden">
                            <div className="h-7 w-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-red-500">
                              <Heart className="h-3.5 w-3.5 fill-current" />
                            </div>
                          </div>
                        )}
                      </Card>
                    </Link>
                  )
                })}
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
