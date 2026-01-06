"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment, runTransaction, Timestamp, setDoc, deleteDoc, orderBy } from "firebase/firestore"
import { cn, getImageUrl } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, ThumbsDown, Share2, Calendar, Star as StarIcon, Info, MessageSquare, Play, Edit, Trash } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FadeIn } from "@/components/animations/fade-in"
import { MovieRatingModal } from "@/components/movie-rating-modal"
import { TrailerModal } from "@/components/trailer-modal"
import { MovieCard } from "@/components/movie-card"
import { ShareButton } from "@/components/share-button"

export default function MovieDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [movie, setMovie] = useState<any>(null)
  const [cast, setCast] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchMovieDetails()
    incrementViewCount()
  }, [params.id, user, isRatingModalOpen])

  const incrementViewCount = async () => {
    const movieId = params.id as string
    const storageKey = `viewed_movie_${movieId}`
    if (sessionStorage.getItem(storageKey)) return

    try {
      const movieRef = doc(db, "artifacts/default-app-id/movies", movieId)
      await updateDoc(movieRef, {
        views: increment(1)
      })
      sessionStorage.setItem(storageKey, "true")
    } catch (e) {
      console.error("Error incrementing view:", e)
    }
  }

  const fetchMovieDetails = async () => {
    try {
      const movieId = params.id as string
      const movieRef = doc(db, "artifacts/default-app-id/movies", movieId)
      const movieDoc = await getDoc(movieRef)

      if (!movieDoc.exists()) {
        setMovie(null)
        return
      }

      const movieData: any = { id: movieDoc.id, ...movieDoc.data() }

      // Scheduled Check
      const now = new Date().getTime()
      let scheduledTime = 0
      if (movieData.scheduledAt) {
        scheduledTime = movieData.scheduledAt.seconds ? movieData.scheduledAt.seconds * 1000 : 0
      }

      if (scheduledTime > now) {
        toast.error("Movie not yet scheduled to be published.")
        setMovie(null) // Or show specific "Coming Soon" state
        return
      }

      setMovie(movieData)

      // Fetch Cast
      if (movieData.cast && movieData.cast.length > 0) {
        // Handle both simple ID strings and object definitions if any (legacy usually stored objects {id, name})
        // Based on user snippet: "cast.map(async (person) => ... celebrities/{person.id}"
        // So cast might be array of objects with 'id'
        const castPromises = movieData.cast.map(async (person: any) => {
          const id = typeof person === 'string' ? person : person.id
          if (!id) return null
          const snap = await getDoc(doc(db, "artifacts/default-app-id/celebrities", id))
          return snap.exists() ? { id: snap.id, ...snap.data() } : { id, name: person.name || 'Unknown' }
        })

        const castDocs = await Promise.all(castPromises)
        setCast(castDocs.filter((c: any) => c !== null))
      }

      // Fetch Reviews
      const reviewsQuery = query(
        collection(db, "artifacts/default-app-id/reviews"),
        where("movieId", "==", movieId),
        where("approved", "==", true),
        orderBy("createdAt", "desc")
      )
      // Note: Index might be needed for 'createdAt' desc. If fail, remove orderBy
      try {
        const reviewsSnapshot = await getDocs(reviewsQuery)
        setReviews(reviewsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      } catch (e) {
        console.warn("Index missing for reviews sort, fetching without sort first")
        const reviewsQueryFallback = query(
          collection(db, "artifacts/default-app-id/reviews"),
          where("movieId", "==", movieId),
          where("approved", "==", true)
        )
        const reviewsSnapshot = await getDocs(reviewsQueryFallback)
        setReviews(reviewsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      }

      // Fetch User Reaction
      // We'll use the legacy path style: movies/{id}/feedback/{userId}
      if (user) {
        const feedbackRef = doc(db, `artifacts/default-app-id/movies/${movieId}/feedback/${user.uid}`)
        const feedbackSnap = await getDoc(feedbackRef)
        if (feedbackSnap.exists()) {
          setUserReaction(feedbackSnap.data().type)
        }
      }

    } catch (error) {
      console.error("Error fetching movie details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (type: "like" | "dislike") => {
    if (!user) {
      toast.error("Please login to react.")
      return
    }
    if (!movie) return

    // Optimistic Update
    const previousReaction = userReaction
    const previousLikes = movie.likesCount || 0
    const previousDislikes = movie.dislikesCount || 0

    let newLikes = previousLikes
    let newDislikes = previousDislikes
    let newReaction: "like" | "dislike" | null = type

    if (previousReaction === type) {
      // Toggle off
      newReaction = null
      if (type === 'like') newLikes--
      else newDislikes--
    } else {
      // Switching or Adding
      if (previousReaction === 'like') newLikes--
      if (previousReaction === 'dislike') newDislikes--

      if (type === 'like') newLikes++
      else newDislikes++
    }

    // Update UI immediately
    setUserReaction(newReaction)
    setMovie({ ...movie, likesCount: newLikes, dislikesCount: newDislikes })

    try {
      const movieId = movie.id
      const userId = user.uid
      const movieRef = doc(db, "artifacts/default-app-id/movies", movieId)
      const feedbackRef = doc(db, `artifacts/default-app-id/movies/${movieId}/feedback/${userId}`)

      await runTransaction(db, async (transaction) => {
        const movieDoc = await transaction.get(movieRef)
        if (!movieDoc.exists()) throw "Movie does not exist!"

        const currentMovieData = movieDoc.data()
        const feedbackDoc = await transaction.get(feedbackRef)
        const currentFeedback = feedbackDoc.exists() ? feedbackDoc.data().type : null

        let finalLikes = currentMovieData.likesCount || 0
        let finalDislikes = currentMovieData.dislikesCount || 0

        // Apply logic again on server data to be safe
        if (currentFeedback === type) {
          // remove reaction
          if (type === 'like') finalLikes = Math.max(0, finalLikes - 1)
          else finalDislikes = Math.max(0, finalDislikes - 1)
          transaction.delete(feedbackRef) // Or set type: null
        } else {
          // switching or adding
          if (currentFeedback === 'like') finalLikes = Math.max(0, finalLikes - 1)
          if (currentFeedback === 'dislike') finalDislikes = Math.max(0, finalDislikes - 1)

          if (type === 'like') finalLikes++
          else finalDislikes++

          transaction.set(feedbackRef, { type, updatedAt: Timestamp.now() }, { merge: true })
        }

        transaction.update(movieRef, {
          likesCount: finalLikes,
          dislikesCount: finalDislikes
        })
      })

    } catch (error) {
      console.error("Reaction failed:", error)
      toast.error("Failed to update reaction")
      // Revert UI
      setUserReaction(previousReaction)
      setMovie({ ...movie, likesCount: previousLikes, dislikesCount: previousDislikes })
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: movie.title,
      text: `Check out "${movie.title}" on Movie Lovers!`,
      url: window.location.href
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (e) {
        console.log("Share skipped", e)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleDeleteReview = async (reviewItem: any) => {
    if (!confirm("Are you sure you want to delete your review?")) return

    try {
      await deleteDoc(doc(db, "artifacts/default-app-id/reviews", reviewItem.id))

      if (user) {
        // Try deleting by exact ID, or search if deterministic logic was mixed
        // New logic uses deterministic ID same as global
        try {
          await deleteDoc(doc(db, `artifacts/default-app-id/users/${user.uid}/userReviews`, reviewItem.id))
        } catch (e) { console.warn("Could not delete user copy", e) }
      }

      // Update movie stats
      await updateDoc(doc(db, "artifacts/default-app-id/movies", movie.id), {
        reviewCount: increment(-1),
      })

      toast.success("Review deleted")

      // Update local state
      setReviews(prev => prev.filter(r => r.id !== reviewItem.id))
      fetchMovieDetails() // Refresh avg rating
    } catch (error) {
      console.error("Error deleting review:", error)
      toast.error("Failed to delete review")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-[400px] bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 w-1/3 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Info className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Movie Not Found</h2>
          <p className="text-muted-foreground">This movie might not be available or hasn't been scheduled for release yet.</p>
          <Button onClick={() => router.push('/movies-info')} className="mt-6" variant="outline">Browse Movies</Button>
        </div>
      </div>
    )
  }

  const isUpcoming = (() => {
    if (!movie?.releaseDate) return false
    try {
      const now = new Date()
      let release: Date
      if (movie.releaseDate.toDate) release = movie.releaseDate.toDate()
      else if (movie.releaseDate.seconds) release = new Date(movie.releaseDate.seconds * 1000)
      else release = new Date(movie.releaseDate)
      return release > now
    } catch { return false }
  })()

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      {/* Hero / Backdrop */}
      <div className="relative h-[30vh] md:h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
        <Image
          src={getImageUrl(movie.poster || movie.posterUrl)}
          alt={movie.title}
          fill
          sizes="100vw"
          className="object-cover blur-sm opacity-50 select-none"
          priority
        />
      </div>

      <main className="container mx-auto px-4 -mt-[20vh] md:-mt-[350px] relative z-20">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Left Column: Poster & Actions */}
          <div className="w-full md:w-[300px] flex-shrink-0 space-y-6">
            <FadeIn>
              <div className="relative w-[200px] md:w-full mx-auto aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-4 border-background/20 bg-muted">
                <Image
                  src={getImageUrl(movie.poster || movie.posterUrl)}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 200px, 300px"
                  className="object-cover"
                />
              </div>
            </FadeIn>

            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardContent className="p-4 space-y-2">
                {/* Reaction Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={userReaction === 'like' ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => handleReaction('like')}
                  >
                    <ThumbsUp className={`h-4 w-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                    {movie.likesCount || 0}
                  </Button>
                  <Button
                    variant={userReaction === 'dislike' ? "destructive" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => handleReaction('dislike')}
                  >
                    <ThumbsDown className={`h-4 w-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                    {movie.dislikesCount || 0}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Rate & Review Button */}
                {isUpcoming ? (
                  <Button className="w-full gap-2 cursor-not-allowed opacity-80" variant="secondary" disabled>
                    <Calendar className="h-4 w-4" />
                    Coming Soon
                  </Button>
                ) : (
                  <Button className="w-full gap-2" variant="secondary" onClick={() => setIsRatingModalOpen(true)}>
                    <MessageSquare className="h-4 w-4" />
                    Rate & Review
                  </Button>
                )}

              </CardContent>
            </Card>

            {/* OTT Platforms */}
            {movie.ottPlatforms && movie.ottPlatforms.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Available On</h3>
                <div className="flex flex-wrap gap-3">
                  {movie.ottPlatforms.map((platform: string) => {
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
                    const key = platform.toLowerCase()
                    const iconSrc = ottPlatformImages[key]

                    if (iconSrc) {
                      return (
                        <div key={platform} className="relative w-10 h-10 rounded-full overflow-hidden border border-border/50 bg-background shadow-sm hover:scale-110 transition-transform" title={platform}>
                          <Image src={iconSrc} alt={platform} fill className="object-cover" />
                        </div>
                      )
                    }

                    return (
                      <Badge key={platform} variant="secondary" className="px-3 py-1 text-sm bg-secondary/80">
                        {platform}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Info */}
          <div className="flex-1 space-y-8 pt-0">
            <FadeIn delay={0.2}>
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-primary border-primary/50">{movie.industry}</Badge>
                  {/* Parse Genre */}
                  {(() => {
                    const genres = Array.isArray(movie.genre) ? movie.genre : movie.genre?.split(',')
                    return genres?.map((g: string) => (
                      <Badge key={g} variant="secondary">{g.trim()}</Badge>
                    ))
                  })()}
                  {movie.releaseDate && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {movie.releaseDate.toDate ? new Date(movie.releaseDate.toDate()).toLocaleDateString() : new Date(movie.releaseDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  {movie.title}
                </h1>

                {movie.avgRating && (
                  <div className="flex items-center gap-2 mb-4">
                    <StarIcon className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-xl font-bold">{movie.avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({movie.reviewCount || 0} reviews)</span>
                  </div>
                )}
              </div>

              {/* Trailer */}
              {(() => {
                const trailerLink = movie.trailerUrl || movie.trailerLink
                if (!trailerLink) return null

                const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
                const match = trailerLink.match(ytRegex)
                const videoId = match ? match[1] : null

                if (!videoId) return null

                return (
                  <div className="w-full max-w-3xl mx-auto">
                    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-border/20">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                )
              })()}

              {/* About */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold border-l-4 border-primary pl-4">About the Movie</h2>
                <p className={`text-muted-foreground leading-relaxed whitespace-pre-line ${!showFullDescription && 'line-clamp-4'}`}>
                  {movie.description || "No description available."}
                </p>
                {movie.description && movie.description.length > 300 && (
                  <Button variant="link" onClick={() => setShowFullDescription(!showFullDescription)} className="p-0 h-auto">
                    {showFullDescription ? "Show Less" : "Read More"}
                  </Button>
                )}
              </div>

              {/* Cast */}
              {cast.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold border-l-4 border-primary pl-4">Cast & Crew</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {cast.map((person) => (
                      <Link href={`/celebrity/${person.id}`} key={person.id} className="group">
                        <div className="bg-card hover:bg-muted/50 rounded-lg p-3 transition-colors text-center border border-border/40">
                          <div className="relative h-20 w-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-background shadow-md group-hover:border-primary transition-colors">
                            <Image
                              src={person.profileImage || person.image || person.imageUrl || "/placeholder.svg"}
                              alt={person.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary">{person.name}</p>
                          <p className="text-xs text-muted-foreground">{person.role || "Actor"}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Reviews */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold border-l-4 border-primary pl-4">Audience Reviews</h2>
                  {!isUpcoming && <Button size="sm" variant="outline" onClick={() => setIsRatingModalOpen(true)}>Write Review</Button>}
                </div>
                {reviews.length === 0 ? (
                  <div className="text-center py-10 bg-muted/30 rounded-xl">
                    <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {reviews.slice(0, 10).map(review => (
                      <Card key={review.id} className="border-border/50 group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{review.userName?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{review.userName || "Anonymous"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : "Recent"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Actions for own review */}
                              {user && review.userId === user.uid && (
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => setIsRatingModalOpen(true)}
                                    title="Edit Review"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteReview(review)}
                                    title="Delete Review"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                              <div className="flex items-center text-yellow-500 gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <StarIcon key={i} className={`h-3 w-3 ${i < (review.rating || 0) ? 'fill-current' : 'text-muted/30'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-foreground/80">{review.review}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

            </FadeIn>
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {movie && (
        <>
          <MovieRatingModal
            movie={movie}
            isOpen={isRatingModalOpen}
            onClose={() => setIsRatingModalOpen(false)}
            user={user}
          />
          <TrailerModal
            isOpen={isTrailerOpen}
            onClose={() => setIsTrailerOpen(false)}
            videoUrl={movie.trailerUrl || movie.trailerLink || ""}
            posterUrl={movie.poster || movie.posterUrl || ""}
            title={movie.title}
          />
        </>
      )}
    </div>
  )
}
