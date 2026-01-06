"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Film, Newspaper } from "lucide-react"

export function ContentInsights() {
    const [movies, setMovies] = useState<any[]>([])
    const [news, setNews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Top Movies
                const moviesQ = query(
                    collection(db, "artifacts/default-app-id/movies"),
                    orderBy("views", "desc"),
                    limit(5)
                )

                // Top News
                const newsQ = query(
                    collection(db, "artifacts/default-app-id/news"),
                    orderBy("views", "desc"),
                    limit(5)
                )

                const [moviesSnap, newsSnap] = await Promise.all([
                    getDocs(moviesQ),
                    getDocs(newsQ)
                ])

                setMovies(moviesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
                setNews(newsSnap.docs.map(d => ({ id: d.id, ...d.data() })))

            } catch (error) {
                console.error("Error fetching content insights:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
                <CardTitle>Content Insights</CardTitle>
                <CardDescription>Most viewed content this month</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="movies" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="movies">Movies</TabsTrigger>
                        <TabsTrigger value="news">News</TabsTrigger>
                    </TabsList>

                    <TabsContent value="movies" className="space-y-4">
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
                            </div>
                        ) : movies.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
                        ) : (
                            movies.map((movie, i) => (
                                <div key={movie.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary font-bold text-sm shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium text-sm truncate">{movie.title}</p>
                                            <p className="text-xs text-muted-foreground">{movie.industry || "Unknown"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Eye className="h-3 w-3" />
                                        <span className="text-xs font-mono">{movie.views || 0}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="news" className="space-y-4">
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
                            </div>
                        ) : news.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
                        ) : (
                            news.map((item, i) => (
                                <div key={item.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary font-bold text-sm shrink-0">
                                            #{i + 1}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium text-sm truncate">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.category || "News"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Eye className="h-3 w-3" />
                                        <span className="text-xs font-mono">{item.views || 0}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
