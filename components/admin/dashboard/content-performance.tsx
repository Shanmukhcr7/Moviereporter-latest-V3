"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Trophy, Star, Users, ArrowRight } from "lucide-react"

export function ContentPerformance() {
    const [topMovies, setTopMovies] = useState<any[]>([])
    // const [topNews, setTopNews] = useState<any[]>([]) 

    useEffect(() => {
        const fetchPerformance = async () => {
            // Fetch Movies sorted by Rating (assuming we store 'averageRating' or just 'rating')
            // If not, we might need to rely on manual 'featured' or just recent for now if rating isn't aggregates.
            // Let's assume we have `rating` field or we sort by latest for now if rating is missing, 
            // but ideally valid schema has `rating`.
            try {
                // Note: Firestore requires index for complex sorts. 
                // We'll try simple orderBy. If index missing, it might fail silently or error in console.
                // Fallback: fetch recent and assume they are relevant.
                const q = query(collection(db, "artifacts/default-app-id/movies"), orderBy("createdAt", "desc"), limit(5))
                const snap = await getDocs(q)
                setTopMovies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            } catch (e) {
                console.error("Failed to fetch top content", e)
            }
        }
        fetchPerformance()
    }, [])

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Content Performance
                </CardTitle>
                <CardDescription>Top performing content this week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Top Movies */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FilmIcon className="h-4 w-4" /> Top Movies (Recently Added)
                    </h3>
                    <div className="space-y-2">
                        {topMovies.map((movie, i) => (
                            <div key={movie.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-muted-foreground w-4 text-center">{i + 1}</div>
                                    <div className="h-8 w-12 bg-muted rounded overflow-hidden">
                                        <img src={movie.posterUrl} className="h-full w-full object-cover" alt="" />
                                    </div>
                                    <div className="text-sm font-medium line-clamp-1 w-[120px]">{movie.title}</div>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-semibold">
                                    {/* Mocking stats if not real */}
                                    <Star className="h-3 w-3 text-amber-500 fill-current" />
                                    {movie.rating || "N/A"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Most Active Categories (Static for now/Mock) */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" /> User Engagement
                    </h3>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-2">
                        <div className="flex justify-between">
                            <span>Tollywood</span>
                            <span className="font-bold">45%</span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[45%]"></div>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span>Kollywood</span>
                            <span className="font-bold">30%</span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full w-[30%]"></div>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}

function FilmIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></svg>
    )
}
