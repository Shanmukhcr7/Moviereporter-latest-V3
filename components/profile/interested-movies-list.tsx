"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, deleteDoc, query, orderBy, limit, startAfter } from "firebase/firestore"
import { Loader2, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function InterestedMoviesList() {
    const { user } = useAuth()
    const [movies, setMovies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [lastDoc, setLastDoc] = useState<any>(null)
    const [hasMore, setHasMore] = useState(true)
    const BATCH_SIZE = 4

    const fetchDetail = async (d: any) => {
        // Doc ID is movie ID
        const mDoc = await getDoc(doc(db, "artifacts/default-app-id/movies", d.id))
        if (mDoc.exists()) {
            return { id: d.id, ...mDoc.data() }
        }
        return null
    }

    const loadInterests = async (isInitial = false) => {
        if (!user) return

        if (isInitial) {
            setLoading(true)
            setHasMore(true)
        } else {
            setLoadingMore(true)
        }

        try {
            // Note: If 'addedAt' is missing on old data vs new data, this might need an index or composite index exception.
            // But since 'addToInterests' adds it, we should be good for new items. 
            // If old items lack it, they might not appear or be at bottom if we don't handle it.
            // Assuming most data has it or we accept this constraint for pagination clarity.
            let q = query(
                collection(db, "artifacts/default-app-id/users", user.uid, "interests"),
                orderBy("addedAt", "desc"),
                limit(BATCH_SIZE + 1)
            )

            if (!isInitial && lastDoc) {
                q = query(
                    collection(db, "artifacts/default-app-id/users", user.uid, "interests"),
                    orderBy("addedAt", "desc"),
                    startAfter(lastDoc),
                    limit(BATCH_SIZE + 1)
                )
            }

            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                if (isInitial) setMovies([])
                setHasMore(false)
                setLoading(false)
                setLoadingMore(false)
                return
            }

            const gotMore = snapshot.docs.length > BATCH_SIZE
            setHasMore(gotMore)

            const docsToProcess = gotMore ? snapshot.docs.slice(0, BATCH_SIZE) : snapshot.docs
            setLastDoc(docsToProcess[docsToProcess.length - 1])

            const detailed = await Promise.all(docsToProcess.map(fetchDetail))
            const filtered = detailed.filter(Boolean)

            if (isInitial) {
                setMovies(filtered)
            } else {
                setMovies(prev => [...prev, ...filtered])
            }
        } catch (error) {
            console.error(error)
            // Fallback if index error or missing "addedAt" on mostly old data: 
            // Try fetching without orderBy if it fails, or just log.
        }
        finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        loadInterests(true)
    }, [user])

    const handleRemove = async (movieId: string) => {
        if (!confirm("Remove from Interested list?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "interests", movieId))
            toast.success("Removed")
            // Local update 
            setMovies(prev => prev.filter(m => m.id !== movieId))
        } catch (e) { toast.error("Failed to remove") }
    }

    if (loading) return <Loader2 className="animate-spin" />
    if (movies.length === 0) return <p className="text-muted-foreground">No interested movies yet.</p>

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movies.map(m => (
                    <div key={m.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <img src={m.posterUrl || "/placeholder.png"} alt={m.title} className="w-20 h-28 object-cover rounded bg-muted" />
                        <div className="flex flex-col justify-between flex-1">
                            <div>
                                <h4 className="font-semibold text-lg line-clamp-1">{m.title}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Release: {m.releaseDate ? new Date(m.releaseDate.toDate ? m.releaseDate.toDate() : m.releaseDate).toLocaleDateString() : 'TBD'}
                                </p>
                            </div>

                            <div className="flex justify-end mt-2">
                                <Button variant="destructive" size="sm" onClick={() => handleRemove(m.id)}>
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={() => loadInterests(false)} disabled={loadingMore}>
                        {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}
        </div>
    )
}
