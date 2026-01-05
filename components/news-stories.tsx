"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

interface Story {
    id: string
    title: string
    image: string
    summary?: string
    publishedAt: any
    type: "news" | "movie"
}

export function NewsStories() {
    const [stories, setStories] = useState<Story[]>([])
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        fetchStories()
    }, [])

    useEffect(() => {
        if (selectedStoryIndex !== null) {
            document.body.style.overflow = "hidden"
            // Reset progress
            setProgress(0)

            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        handleNext()
                        return 0
                    }
                    return prev + 1 // speed
                })
            }, 50)

            return () => {
                clearInterval(timer)
                document.body.style.overflow = "unset"
            }
        }
    }, [selectedStoryIndex])

    const fetchStories = async () => {
        // 1. Try Cache
        const cacheKey = "news_stories_mixed_v1"
        const cached = getFromCache<Story[]>(cacheKey)
        if (cached) {
            setStories(cached)
            return
        }

        try {
            // 2. Fetch News
            const newsRef = collection(db, "artifacts/default-app-id/news")
            const newsQuery = query(newsRef, orderBy("scheduledAt", "desc"), limit(6))

            // 3. Fetch Movies
            const moviesRef = collection(db, "artifacts/default-app-id/movies")
            const moviesQuery = query(moviesRef, orderBy("releaseDate", "desc"), limit(6))

            const [newsSnap, moviesSnap] = await Promise.all([
                getDocs(newsQuery),
                getDocs(moviesQuery)
            ])

            const newsItems = newsSnap.docs.map(doc => {
                const d = doc.data()
                return {
                    id: doc.id,
                    title: d.title,
                    image: d.image || d.imageUrl || "/placeholder.svg",
                    summary: d.summary,
                    publishedAt: d.scheduledAt ? d.scheduledAt.toDate() : new Date(),
                    type: "news" as const
                }
            })

            const movieItems = moviesSnap.docs.map(doc => {
                const d = doc.data()
                return {
                    id: doc.id,
                    title: d.title,
                    image: d.poster || d.posterUrl || d.image || "/placeholder.svg",
                    summary: d.description ? d.description.slice(0, 100) + "..." : "Check out this movie!",
                    publishedAt: d.releaseDate ? (d.releaseDate.toDate ? d.releaseDate.toDate() : new Date(d.releaseDate)) : new Date(),
                    type: "movie" as const
                }
            })

            // 4. Merge and Sort desc
            const allStories = [...newsItems, ...movieItems].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, 15)

            const formattedStories = allStories.map(s => ({
                ...s,
                publishedAt: s.publishedAt.toISOString()
            }))

            setStories(formattedStories)
            saveToCache(cacheKey, formattedStories)

        } catch (error) {
            console.error("Error fetching stories:", error)
            setFallbackStories()
        }
    }

    const setFallbackStories = () => {
        setStories([
            { id: "1", type: "news", title: "Welcome", image: "/assets/placeholder-story-1.jpg", publishedAt: null, summary: "Welcome to Movie Reporter! Check out the latest updates here." },
            { id: "2", type: "movie", title: "Trending", image: "/assets/placeholder-story-2.jpg", publishedAt: null, summary: "See what's trending in the world of cinema today." },
            { id: "3", type: "news", title: "New Feature", image: "/assets/placeholder-story-3.jpg", publishedAt: null, summary: "Brand new features just for you." },
        ])
    }

    const handleNext = () => {
        if (selectedStoryIndex === null) return
        if (selectedStoryIndex < stories.length - 1) {
            setSelectedStoryIndex(selectedStoryIndex + 1)
        } else {
            setSelectedStoryIndex(null)
        }
    }

    const handlePrev = () => {
        if (selectedStoryIndex === null) return
        if (selectedStoryIndex > 0) {
            setSelectedStoryIndex(selectedStoryIndex - 1)
        }
    }

    // If stories empty after fetch attempt, use fallback immediately to ensure visibility during dev
    useEffect(() => {
        if (stories.length === 0) {
            const timer = setTimeout(() => {
                if (stories.length === 0) setFallbackStories()
            }, 4000) // Increased timeout for dual fetch
            return () => clearTimeout(timer)
        }
    }, [stories])

    if (stories.length === 0) return (
        <div className="w-full flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
    )

    return (
        <>
            {/* Story Bar */}
            <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-4 px-4 min-w-max">
                    {stories.map((story, index) => (
                        <div
                            key={story.id}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                            onClick={() => setSelectedStoryIndex(index)}
                        >
                            <div className={`relative p-[3px] rounded-full group-hover:scale-105 transition-transform ${story.type === 'movie' ? 'bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-orange-500'}`}>
                                <div className="bg-background rounded-full p-[2px]">
                                    <Avatar className="h-16 w-16 border-2 border-background">
                                        <AvatarImage src={story.image} className="object-cover" />
                                        <AvatarFallback>{story.type === 'movie' ? 'M' : 'N'}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <span className="text-[10px] w-16 text-center truncate font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                {story.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fullscreen Viewer */}
            <AnimatePresence>
                {selectedStoryIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-0 md:p-8"
                    >
                        {/* Story Content */}
                        <div className="relative w-full h-full md:max-w-md md:aspect-[9/16] md:h-auto bg-zinc-900 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col">

                            {/* Progress Bar */}
                            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
                                {stories.map((_, i) => (
                                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                        {i === selectedStoryIndex && (
                                            <motion.div
                                                className="h-full bg-white"
                                                style={{ width: `${progress}%` }}
                                            />
                                        )}
                                        {i < selectedStoryIndex && <div className="h-full bg-white" />}
                                    </div>
                                ))}
                            </div>

                            {/* Header inside viewer */}
                            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center mt-4">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border border-white/20">
                                        <AvatarImage src={stories[selectedStoryIndex].image} />
                                        <AvatarFallback>{stories[selectedStoryIndex].type === 'movie' ? 'M' : 'N'}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-white font-semibold text-sm truncate max-w-[200px] shadow-sm">
                                        {stories[selectedStoryIndex].title}
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => setSelectedStoryIndex(null)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Main Image */}
                            <div className="relative flex-1 bg-black">
                                <Image
                                    src={stories[selectedStoryIndex].image}
                                    alt={stories[selectedStoryIndex].title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                            </div>

                            {/* Caption / Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 space-y-4">
                                <div className="flex gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${stories[selectedStoryIndex].type === 'movie' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {stories[selectedStoryIndex].type}
                                    </span>
                                    {stories[selectedStoryIndex].publishedAt && (
                                        <span className="text-[10px] text-white/60 flex items-center">
                                            {new Date(stories[selectedStoryIndex].publishedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-white text-xl font-bold leading-tight">
                                    {stories[selectedStoryIndex].title}
                                </h2>
                                {stories[selectedStoryIndex].summary && (
                                    <p className="text-white/80 text-sm line-clamp-3">
                                        {stories[selectedStoryIndex].summary}
                                    </p>
                                )}
                                <Link href={`/${stories[selectedStoryIndex].type === 'movie' ? 'movie' : 'news'}/${stories[selectedStoryIndex].id}`}>
                                    <Button className="w-full rounded-full bg-white text-black hover:bg-white/90 font-bold mt-2" onClick={() => setSelectedStoryIndex(null)}>
                                        {stories[selectedStoryIndex].type === 'movie' ? 'Check Movie Details' : 'Read Full Article'}
                                    </Button>
                                </Link>
                            </div>

                            {/* Tap Zones */}
                            <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} />
                            <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
