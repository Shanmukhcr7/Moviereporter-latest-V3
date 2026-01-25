"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { FadeIn } from "@/components/animations/fade-in"
import { PlayCircle, Clapperboard } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TrailersPage() {
    const [allVideos, setAllVideos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null)

    useEffect(() => {
        const fetchTrailers = async () => {
            try {
                const q = query(collection(db, "artifacts/default-app-id/trailers"), orderBy("createdAt", "desc"))
                const querySnapshot = await getDocs(q)
                const results = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setAllVideos(results)
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

    const trailers = allVideos.filter(v => !v.type || v.type === "trailer")
    const teasers = allVideos.filter(v => v.type === "teaser")

    const VideoGrid = ({ videos }: { videos: any[] }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <div className="aspect-video rounded-lg bg-muted animate-pulse" />
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    </div>
                ))
            ) : videos.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                    No videos found in this section.
                </div>
            ) : (
                videos.map((video) => (
                    <div
                        key={video.id}
                        className="group cursor-pointer space-y-3"
                        onClick={() => setSelectedVideo(video)}
                    >
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-muted">
                            <Image
                                src={video.thumbnailUrl || "/placeholder.svg"}
                                alt={video.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-white drop-shadow-lg transition-colors" />
                            </div>

                        </div>
                        <div>
                            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                {video.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {video.createdAt ? formatDistanceToNow(video.createdAt.toDate(), { addSuffix: true }) : ''}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <FadeIn>
                    <div className="flex items-center gap-3 mb-8">
                        <Clapperboard className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">Latest Trailers & Teasers</h1>
                    </div>

                    <Tabs defaultValue="trailers" className="w-full">
                        <TabsList className="mb-8 grid w-full max-w-[400px] grid-cols-2">
                            <TabsTrigger value="trailers">Trailers</TabsTrigger>
                            <TabsTrigger value="teasers">Teasers</TabsTrigger>
                        </TabsList>

                        <TabsContent value="trailers">
                            <VideoGrid videos={trailers} />
                        </TabsContent>

                        <TabsContent value="teasers">
                            <VideoGrid videos={teasers} />
                        </TabsContent>
                    </Tabs>

                    {/* Video Player Modal */}
                    <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                        <DialogContent className="max-w-5xl bg-black border-none p-0 overflow-hidden aspect-video">
                            {selectedVideo && (
                                <>
                                    <DialogTitle className="sr-only">{selectedVideo?.title}</DialogTitle>
                                    {(() => {
                                        const videoId = getYouTubeId(selectedVideo.youtubeUrl);
                                        return (
                                            <div className="relative w-full h-full">
                                                {videoId ? (
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                                                        title={selectedVideo.title}
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
                                </>
                            )}
                        </DialogContent>
                    </Dialog>

                </FadeIn>
            </main>
        </div>
    )
}
