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
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            <Header />

            {/* Immersive Hero Section */}
            <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
                {/* Background Image with Blur */}
                <Image
                    src={displayImage}
                    alt={celebrity.name}
                    fill
                    className="object-cover blur-md opacity-50 scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                {/* Hero Content (Name & Role) */}
                <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-12 z-10 flex flex-col items-center md:items-start">
                    <div className="md:pl-[280px] text-center md:text-left">
                        <Badge variant="secondary" className="mb-2 backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20">{celebrity.role}</Badge>
                        <h1 className="text-4xl md:text-7xl font-black tracking-tight text-foreground drop-shadow-lg mb-2">{celebrity.name}</h1>
                        <p className="text-muted-foreground max-w-2xl line-clamp-2 md:line-clamp-none hidden md:block">
                            {celebrity.description?.substring(0, 150)}...
                        </p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 relative z-20 -mt-20 md:-mt-32 pb-20">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Floating Profile Column */}
                    <div className="shrink-0 flex flex-col items-center md:block md:w-[250px]">
                        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full md:rounded-2xl overflow-hidden shadow-2xl border-4 border-background bg-muted">
                            <Image src={displayImage} alt={celebrity.name} fill className="object-cover" />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 w-full mt-6">
                            <Button
                                className={`w-full h-12 text-lg font-semibold shadow-lg transition-all ${isFavorite ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary hover:bg-primary/90"}`}
                                onClick={handleToggleFavorite}
                                disabled={favLoading}
                            >
                                <Heart className={`w-5 h-5 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                                {isFavorite ? "Favorite" : "Add to Favorites"}
                            </Button>
                            <Button variant="outline" className="w-full h-11 border-primary/20 hover:bg-primary/5" onClick={handleShare}>
                                <Share2 className="w-4 h-4 mr-2" /> Share Profile
                            </Button>
                        </div>

                        {/* Quick Stats Mobile only (Desktop uses specific area) */}
                        <div className="flex gap-4 mt-6 md:hidden w-full justify-between px-4 bg-muted/30 py-3 rounded-lg border border-border/50">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{likesCount}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Likes</p>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="text-center">
                                <p className="text-2xl font-bold">{movies.length}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Movies</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 pt-4 md:pt-[140px] space-y-12">

                        {/* Stats Bar (Desktop) */}
                        <div className="hidden md:flex items-center gap-12 p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
                                    <Heart className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold leading-none">{likesCount}</p>
                                    <p className="text-sm text-muted-foreground font-medium">Fan Following</p>
                                </div>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
                                    <Film className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold leading-none">{movies.length}</p>
                                    <p className="text-sm text-muted-foreground font-medium">Movies Released</p>
                                </div>
                            </div>
                        </div>

                        {/* Biography */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold border-l-4 border-primary pl-4">About {celebrity.name}</h2>
                            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground/90 leading-relaxed bg-card/30 p-6 rounded-xl border border-border/30">
                                <p className="whitespace-pre-wrap">
                                    {showFullBio ? celebrity.description : `${celebrity.description?.substring(0, 450) || "No biography available yet."}...`}
                                </p>
                                {(celebrity.description?.length || 0) > 450 && (
                                    <Button variant="link" className="px-0 mt-2 h-auto text-primary font-semibold text-base" onClick={() => setShowFullBio(!showFullBio)}>
                                        {showFullBio ? "Read Less" : "Read Full Biography"}
                                    </Button>
                                )}
                            </div>
                        </section>

                        {/* Filmography Grid */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold border-l-4 border-primary pl-4">Filmography</h2>
                            </div>

                            {movies.length === 0 ? (
                                <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                                    <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-muted-foreground">No movies found in our database.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {movies.map((movie) => (
                                        <Link
                                            key={movie.id}
                                            href={`/movie/${movie.id}`}
                                            className="group relative aspect-[2/3] rounded-xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 duration-300"
                                        >
                                            <Image
                                                src={movie.poster || movie.posterUrl || "/placeholder.svg"}
                                                alt={movie.title}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <p className="text-white font-bold line-clamp-2 md:text-lg">{movie.title}</p>
                                                <p className="text-white/70 text-sm font-medium mt-1">
                                                    {movie.releaseDate && !isNaN(new Date(movie.releaseDate).getFullYear()) ? new Date(movie.releaseDate).getFullYear() : "N/A"}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Similar Celebrities */}
                        {relatedCelebs.length > 0 && (
                            <section className="space-y-6 pt-8 border-t border-border/40">
                                <h2 className="text-2xl font-bold border-l-4 border-primary pl-4">Related Celebrities</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {relatedCelebs.map(c => (
                                        <Link key={c.id} href={`/celebrity/${c.id}`} className="group flex flex-col items-center">
                                            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 border-2 border-border/50 group-hover:border-primary transition-colors bg-muted">
                                                <Image src={c.image || c.imageUrl || c.profileImage || "/placeholder.svg"} alt={c.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="font-semibold text-center text-sm md:text-base group-hover:text-primary transition-colors">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">{c.role}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
