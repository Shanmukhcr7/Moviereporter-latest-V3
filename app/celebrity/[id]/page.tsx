"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment, setDoc, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Share2, Film, Heart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { FadeIn } from "@/components/animations/fade-in"

export default function CelebrityDetailsPage() {
  const params = useParams()
  const { user } = useAuth()
  const [paramsId] = useState<string>(() => {
    if (!params?.id) return ""
    return Array.isArray(params.id) ? params.id[0] : params.id
  })
  const [celebrity, setCelebrity] = useState<any>(null)
  const [movies, setMovies] = useState<any[]>([])
  const [relatedCelebs, setRelatedCelebs] = useState<any[]>([])
  const [showFullBio, setShowFullBio] = useState(false)
  const [loading, setLoading] = useState(true)

  // Favorites
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [likesCount, setLikesCount] = useState(0)


  useEffect(() => {
    if (params.id) {
      fetchCelebrityDetails()
      if (user) checkFavoriteStatus()
    }
  }, [params.id, user])

  const checkFavoriteStatus = async () => {
    try {
      const docRef = doc(db, `artifacts/default-app-id/users/${user?.uid}/favoritesCelebrities`, paramsId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists() && docSnap.data().isFavorite) {
        setIsFavorite(true)
      } else {
        setIsFavorite(false)
      }
    } catch (e) {
      console.error("Error checking favorite:", e)
    }
  }

  const fetchCelebrityDetails = async () => {
    try {
      const celebDoc = await getDoc(doc(db, "artifacts/default-app-id/celebrities", paramsId))

      if (celebDoc.exists()) {
        const celebData = { id: celebDoc.id, ...celebDoc.data() } as any // Typecast to avoid TS error
        setCelebrity(celebData)
        setLikesCount(celebData.favoritesCount || 0)

        // Fetch movies where this celebrity is in the cast
        const moviesQuery = query(
          collection(db, "artifacts/default-app-id/movies"),
          where("castIds", "array-contains", paramsId),
        )
        const moviesSnapshot = await getDocs(moviesQuery)
        setMovies(
          moviesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        )

        // Fetch Related Celebrities (Generic recommendation for now)
        try {
          const relatedQ = query(collection(db, "artifacts/default-app-id/celebrities"), limit(10))
          const relatedSnap = await getDocs(relatedQ)
          const related = relatedSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(c => c.id !== paramsId)
            .slice(0, 8)
          setRelatedCelebs(related)
        } catch (e) { console.error("Error fetching related celebs", e) }
      }
    } catch (error) {
      console.error("[v0] Error fetching celebrity details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      alert("Please login to like this celebrity.")
      return
    }
    if (favLoading) return

    const newStatus = !isFavorite
    setIsFavorite(newStatus)
    setLikesCount(prev => newStatus ? prev + 1 : prev - 1)
    setFavLoading(true)

    try {
      // Update User's Favorite Record
      const userFavRef = doc(db, `artifacts/default-app-id/users/${user.uid}/favoritesCelebrities`, paramsId)
      await setDoc(userFavRef, {
        celebrityId: paramsId,
        isFavorite: newStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      // Update Celebrity's Count
      const celebRef = doc(db, "artifacts/default-app-id/celebrities", paramsId)
      await updateDoc(celebRef, {
        favoritesCount: increment(newStatus ? 1 : -1)
      })

    } catch (error) {
      console.error("Error toggling favorite:", error)
      // Revert
      setIsFavorite(!newStatus)
      setLikesCount(prev => newStatus ? prev - 1 : prev + 1)
      alert("Failed to update favorite.")
    } finally {
      setFavLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: celebrity.name,
        text: `Check out ${celebrity.name} on Movie Lovers`,
        url: window.location.href,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!celebrity) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Celebrity not found</p>
        </div>
      </div>
    )
  }

  const displayImage = celebrity.image || celebrity.imageUrl || celebrity.profileImage || "/placeholder.svg"

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section - REDUCED HEIGHT per user feedback "looks very big" */}
      <div className="relative h-[25vh] md:h-[250px] overflow-hidden">
        <Image
          src={displayImage}
          alt={celebrity.name}
          fill
          sizes="100vw"
          className="object-cover blur-xl scale-110 opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
      </div>



      <main className="container mx-auto px-4 -mt-32 relative z-10 pb-12">
        {/* Title Section - Moved to top for better mobile hierarchy */}
        <div className="text-center md:text-left mb-8 md:mb-12 mt-16 md:mt-0">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{celebrity.name}</h1>
          <Badge className="text-sm px-3 py-1 shadow-md">{celebrity.role}</Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Celebrity Image & Actions */}
          <div className="space-y-4">
            <FadeIn>
              <div className="flex justify-center md:block">
                <div className="relative w-[200px] md:w-full aspect-[3/4] overflow-hidden rounded-lg shadow-2xl border-4 border-background">
                  <Image src={displayImage} alt={celebrity.name} fill sizes="(max-width: 768px) 200px, 33vw" className="object-cover" />
                </div>
              </div>
            </FadeIn>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isFavorite ? "default" : "outline"}
                className={`w-full ${isFavorite ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                onClick={handleToggleFavorite}
                disabled={favLoading}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "Liked" : "Like"} ({likesCount})
              </Button>

              {/* Share Button */}
              <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>


            {/* Stats */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Movies</p>
                  <p className="text-2xl font-bold">{movies.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Celebrity Details */}
          <div className="md:col-span-2 space-y-8 md:pt-12">
            <FadeIn delay={0.2}>
              {/* Biography (Title removed here) */}
              <div>

                {/* Biography */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Biography</h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {showFullBio ? celebrity.description : `${celebrity.description?.substring(0, 400) || "No description available."}...`}
                  </p>
                  {(celebrity.description?.length || 0) > 400 && (
                    <Button variant="link" className="px-0 mt-2 text-primary" onClick={() => setShowFullBio(!showFullBio)}>
                      {showFullBio ? "Show Less" : "Read More"}
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Filmography */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Film className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">Filmography</h2>
                    <Badge variant="secondary">{movies.length}</Badge>
                  </div>

                  {movies.length === 0 ? (
                    <p className="text-muted-foreground">No movies found</p>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {movies.map((movie) => (
                        <Link key={movie.id} href={`/movie/${movie.id}`}>
                          <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50 bg-card/50 backdrop-blur h-full p-0 gap-0">
                            <div className="relative aspect-[2/3] overflow-hidden">
                              <Image
                                src={movie.poster || movie.posterUrl || "/placeholder.svg"}
                                alt={movie.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <CardContent className="p-2 pt-1">
                              <h3 className="font-semibold text-xs line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                                {movie.title}
                              </h3>
                              <p className="text-[10px] text-muted-foreground mt-0">
                                {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "N/A"}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="my-8" />

                {/* More Celebrities Recommendation */}
                {relatedCelebs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">More Celebrities</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {relatedCelebs.map((c: any) => (
                        <Link key={c.id} href={`/celebrity/${c.id}`} className="min-w-[100px] flex flex-col items-center gap-2 group">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border/50 group-hover:border-primary transition-colors relative">
                            <Image
                              src={c.image || c.imageUrl || c.profileImage || "/placeholder.svg"}
                              alt={c.name}
                              fill
                              sizes="100px"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <p className="text-sm font-medium text-center line-clamp-2 group-hover:text-primary transition-colors leading-tight">{c.name}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </main>
    </div>
  )
}
