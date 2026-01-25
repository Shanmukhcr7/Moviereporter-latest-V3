"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { FadeIn } from "@/components/animations/fade-in"
import { PlayCircle, X, Clapperboard, Calendar } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export default function TrailersPage() {
    const [trailers, setTrailers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTrailer, setSelectedTrailer] = useState<any | null>(null)
    const [featuredTrailer, setFeaturedTrailer] = useState<any | null>(null)

    useEffect(() => {
        const fetchTrailers = async () => {
            try {
                const q = query(collection(db, "artifacts/default-app-id/trailers"), orderBy("createdAt", "desc"))
                const querySnapshot = await getDocs(q)
                const results = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))

                // Find featured trailer or use the latest one
                const featured = results.find((t: any) => t.isFeatured) || results[0]
                setFeaturedTrailer(featured)

                // Filter out featured from main list if you want, or keep it. 
                // Let's keep it in the list but ensure the featured section specific logic works.
                setTrailers(results)
            } catch (error) {
                console.error("Error fetching trailers:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTrailers()
    }, [])

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <FadeIn>
                    <div className="flex items-center gap-3 mb-8">
                        <Clapperboard className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">Latest Trailers & Teasers</h1>
                    </div>

                    {/* Featured Trailer Hero */}
                    {featuredTrailer && (
                        <div className="mb-12 relative rounded-2xl overflow-hidden aspect-video md:aspect-[21/9] group cursor-pointer shadow-2xl border border-white/10"
                            onClick={() => setSelectedTrailer(featuredTrailer)}>
                            <Image
                                src={featuredTrailer.thumbnailUrl}
                                alt={featuredTrailer.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-12">
                                <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-fit mb-3">
                                    FEATURED
                                </span>
                                <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 drop-shadow-md">
                                    {featuredTrailer.title}
                                </h2>
                                <div className="flex items-center gap-4 text-gray-300 text-sm md:text-base">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {featuredTrailer.createdAt ? formatDistanceToNow(featuredTrailer.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </span>
                                </div>
                            </div>
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.5)] group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                                    <PlayCircle className="w-10 h-10 text-white fill-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="aspect-video rounded-lg bg-muted animate-pulse" />
                                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                                </div>
                            ))
                        ) : (
                            trailers.map((trailer) => (
                                <div
                                    key={trailer.id}
                                    className="group cursor-pointer space-y-3"
                                    onClick={() => setSelectedTrailer(trailer)}
                                >
                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-muted">
                                        <Image
                                            src={trailer.thumbnailUrl}
                                            alt={trailer.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                                        </div>
                                        {/* Duration or Tag could go for extra polish */}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                            {trailer.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {trailer.createdAt ? formatDistanceToNow(trailer.createdAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Video Player Modal */}
                    <Dialog open={!!selectedTrailer} onOpenChange={(open) => !open && setSelectedTrailer(null)}>
                        <DialogContent className="max-w-5xl bg-black border-none p-0 overflow-hidden aspect-video">
                            {selectedTrailer && (() => {
                                const videoId = getYouTubeId(selectedTrailer.youtubeUrl);
                                return (
                                    <div className="relative w-full h-full">
                                        {videoId ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                                                title={selectedTrailer.title}
                                                className="absolute inset-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                Invalid Video URL
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                        </DialogContent>
                    </Dialog>

                </FadeIn>
            </main>
        </div>
    )
}
