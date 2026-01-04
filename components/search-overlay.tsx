"use client"

import * as React from "react"
import { Search, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SearchResult {
    id: string
    title: string
    type: "movie" | "celebrity" | "news" | "blog"
    image?: string
}

export function SearchOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [queryText, setQueryText] = React.useState("")
    const [results, setResults] = React.useState<SearchResult[]>([])
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (queryText.length < 2) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const lowerQuery = queryText.toLowerCase()
                const hits: SearchResult[] = []

                // Note: Firestore doesn't support native case-insensitive substring search easily.
                // We will fetch a bit more and filter client-side, OR assume the 'title' field is used.
                // For this port, we'll try a simple method: fetch recent items and filter, 
                // OR rely on a 'keywords' array if it existed.
                // Given the constraints, we will do a best-effort client-side filter on limited sets 
                // OR use `startAt`/`endAt` if titles are exact prefix.
                // The legacy code fetched ALL and filtered client side? "getDocs(collection(...))" -> yes, it fetched EVERYTHING.
                // That is bad for performance but precise for the demo.
                // We will limit to 50 items each and filter client side.

                const fetchData = async (col: string, type: any) => {
                    const q = query(collection(db, `artifacts/default-app-id/${col}`), limit(50))
                    const snap = await getDocs(q)
                    snap.forEach(doc => {
                        const data = doc.data()
                        const title = data.title || data.name || ""
                        if (title.toLowerCase().includes(lowerQuery)) {
                            hits.push({
                                id: doc.id,
                                title,
                                type,
                                image: data.posterUrl || data.imageUrl || data.image
                            })
                        }
                    })
                }

                await Promise.all([
                    fetchData("movies", "movie"),
                    fetchData("celebrities", "celebrity"),
                    fetchData("news", "news"),
                    fetchData("blogs", "blog")
                ])

                setResults(hits.slice(0, 10))
            } catch (err) {
                console.error("Search error", err)
            } finally {
                setLoading(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [queryText])

    const handleSelect = (result: SearchResult) => {
        onOpenChange(false)
        let path = "/"
        switch (result.type) {
            case "movie": path = `/movie/${result.id}`; break
            case "celebrity": path = `/celebrity/${result.id}`; break // Assuming route
            case "news": path = `/news/${result.id}`; break
            case "blog": path = `/blogs/${result.id}`; break
        }
        router.push(path)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] top-[20%] translate-y-0">
                <DialogHeader>
                    <DialogTitle>Search</DialogTitle>
                </DialogHeader>
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search movies, celebs, news..."
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                    {loading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 mt-2">
                    {results.map(res => (
                        <div
                            key={`${res.type}-${res.id}`}
                            className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                            onClick={() => handleSelect(res)}
                        >
                            {res.image && <img src={res.image} alt="" className="w-10 h-10 object-cover rounded" />}
                            <div>
                                <p className="font-medium text-sm">{res.title}</p>
                                <p className="text-xs text-muted-foreground capitalize">{res.type}</p>
                            </div>
                        </div>
                    ))}
                    {queryText.length > 1 && !loading && results.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-4">No results found.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
