"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment, setDoc, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Share2, Film, Heart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { FadeIn } from "@/components/animations/fade-in"

export function CelebrityClient({ initialId }: { initialId?: string }) {
    const params = useParams()
    const { user } = useAuth()
    const paramsId = (initialId || (Array.isArray(params?.id) ? params.id[0] : params.id)) as string

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
        if (paramsId) {
            fetchCelebrityDetails()
            if (user) checkFavoriteStatus()
        }
    }, [paramsId, user])

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
                const celebData = { id: celebDoc.id, ...celebDoc.data() } as any
                setCelebrity(celebData)
                setLikesCount(celebData.favoritesCount || 0)

                // Fetch movies
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

                // Fetch Related
                try {
                    const relatedQ = query(collection(db, "artifacts/default-app-id/celebrities"), limit(10))
                    const relatedSnap = await getDocs(relatedQ)
                    const related = relatedSnap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(c => c.id !== paramsId)
                        .slice(0, 8)
                    setRelatedCelebs(related)
                } catch (e) {
                    console.error("Error fetching related celebs", e)
                }
            }
        } catch (error) {
            console.error("Error fetching celebrity details:", error)
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
            const userFavRef = doc(db, `artifacts/default-app-id/users/${user.uid}/favoritesCelebrities`, paramsId)
            await setDoc(userFavRef, {
                celebrityId: paramsId,
                isFavorite: newStatus,
                updatedAt: new Date().toISOString()
            }, { merge: true })

            const celebRef = doc(db, "artifacts/default-app-id/celebrities", paramsId)
            await updateDoc(celebRef, {
                favoritesCount: increment(newStatus ? 1 : -1)
            })

        } catch (error) {
            console.error("Error toggling favorite:", error)
            setIsFavorite(!newStatus)
            setLikesCount(prev => newStatus ? prev - 1 : prev + 1)
            alert("Failed to update favorite.")
        } finally {
            setFavLoading(false)
        }
    }

    const handleShare = () => {
        // If navigator.share works, great. If not, fallback to clipboard.
        if (navigator.share) {
            navigator.share({
                title: celebrity.name,
                text: `Check out ${celebrity.name} on Movie Lovers`,
                url: window.location.href,
            })
        } else {
            // Simple fallback
            navigator.clipboard.writeText(window.location.href)
            alert("Link copied!")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-12">
                    <div className="h-[30vh] bg-muted rounded-lg w-full mb-8 animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-8 w-1/3 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-full bg-muted rounded animate-pulse" />
                        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                    </div>
                </div>
            </div>
        )
    }

    if (!celebrity) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-muted-foreground text-lg">Celebrity not found</p>
                    <Button variant="link" asChild className="mt-4"><Link href="/">Back Home</Link></Button>
                </div>
            </div>
        )
    }

    const displayImage = celebrity.image || celebrity.imageUrl || celebrity.profileImage || "/placeholder.svg"

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden w-full font-sans">
            <Header />

            {/* Hero Section */}
            <div className="relative h-[180px] md:h-[200px] w-full bg-muted/20">
                <Image
                    src={displayImage}
                    alt={celebrity.name}
                    fill
                    className="object-cover blur-2xl opacity-40 select-none pointer-events-none transform scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>

            <main className="container mx-auto px-4 relative z-10 -mt-24 md:-mt-24 pb-16 max-w-6xl">
                <FadeIn>
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10">

                        {/* Profile Avatar (Left) */}
                        <div className="shrink-0 flex justify-center md:block">
                            <div className="relative w-36 h-36 md:w-56 md:h-56 rounded-xl overflow-hidden shadow-xl border-4 border-background bg-muted">
                                <Image src={displayImage} alt={celebrity.name} fill className="object-cover" />
                            </div>
                        </div>

                        {/* Profile Header Info (Right of Avatar on Desktop, Below on Mobile) */}
                        <div className="flex-1 text-center md:text-left pt-2 md:pt-0 md:pb-2 flex flex-col justify-end">
                            <h1 className="text-3xl md:text-5xl font-bold mb-2">{celebrity.name}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                                <Badge variant="secondary">{celebrity.role}</Badge>
                                {movies.length > 0 && <Badge variant="outline">{movies.length} Movies</Badge>}
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <Button
                                    size="sm"
                                    className={`${isFavorite ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                                    onClick={handleToggleFavorite}
                                    disabled={favLoading}
                                >
                                    <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                                    {isFavorite ? "Liked" : "Like"} ({likesCount})
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleShare}>
                                    <Share2 className="w-4 h-4 mr-2" /> Share
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-8 opacity-50" />

                    {/* Layout Grid: Content + Sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

                        {/* Main Column */}
                        <div className="space-y-10 min-w-0"> {/* min-w-0 is critical for preventing grid blowout */}

                            {/* Biography */}
                            <section>
                                <h2 className="text-2xl font-bold mb-4">Biography</h2>
                                <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                                    <p>{showFullBio ? celebrity.description : `${celebrity.description?.substring(0, 300) || "No description available."}...`}</p>
                                    {(celebrity.description?.length || 0) > 300 && (
                                        <Button variant="link" className="px-0 mt-2 h-auto font-semibold" onClick={() => setShowFullBio(!showFullBio)}>
                                            {showFullBio ? "Read Less" : "Read More"}
                                        </Button>
                                    )}
                                </div>
                            </section>

                            {/* Filmography (Horizontal Scroll) */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Film className="w-5 h-5" /> Filmography
                                    </h2>
                                </div>

                                {movies.length === 0 ? (
                                    <div className="p-8 text-center border rounded-lg bg-muted/20">
                                        <p className="text-muted-foreground">No movies found</p>
                                    </div>
                                ) : (
                                    <div className="relative -mx-4 px-4 md:mx-0 md:px-0"> {/* Negative margin hack for full-bleed mobile */}
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x overscroll-x-contain">
                                            {movies.map((movie) => (
                                                <Link
                                                    key={movie.id}
                                                    href={`/movie/${movie.id}`}
                                                    className="group relative flex-shrink-0 w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden border border-border/50 bg-card shadow-sm snap-start"
                                                >
                                                    <Image
                                                        src={movie.poster || movie.posterUrl || "/placeholder.svg"}
                                                        alt={movie.title}
                                                        fill
                                                        sizes="(max-width: 768px) 120px, 150px"
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    {/* Simple Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                                        <p className="text-white text-xs font-bold line-clamp-2">{movie.title}</p>
                                                        <p className="text-white/80 text-[10px]">
                                                            {movie.releaseDate && !isNaN(new Date(movie.releaseDate).getFullYear()) ? new Date(movie.releaseDate).getFullYear() : "N/A"}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Sidebar Column (Stacked on mobile, Right on Desktop) */}
                        <aside className="space-y-8">
                            {/* Similar Artists */}
                            {relatedCelebs.length > 0 && (
                                <div className="bg-card/40 rounded-xl p-5 border border-border/50">
                                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">You might also like</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {relatedCelebs.slice(0, 5).map(c => (
                                            <Link key={c.id} href={`/celebrity/${c.id}`} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                                                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border/30 bg-muted">
                                                    <Image src={c.image || c.imageUrl || c.profileImage || "/placeholder.svg"} alt={c.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{c.name}</p>
                                                    <p className="text-xs text-muted-foreground">{c.role}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>

                    </div>
                </FadeIn>
            </main>
        </div>
    )
}
