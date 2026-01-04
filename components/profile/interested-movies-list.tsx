"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore"
import { Loader2, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
// Reuse MovieCard or simpler custom card? Custom is easier for this specific layout.
// Legacy used `movie-details.html` link.

export function InterestedMoviesList() {
    const { user } = useAuth()
    const [movies, setMovies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadInterests = async () => {
        if (!user) return
        setLoading(true)
        try {
            const snap = await getDocs(collection(db, "artifacts/default-app-id/users", user.uid, "interests"))
            const detailed = await Promise.all(snap.docs.map(async (d) => {
                const mDoc = await getDoc(doc(db, "artifacts/default-app-id/movies", d.id))
                if (mDoc.exists()) {
                    return { id: d.id, ...mDoc.data() }
                }
                return null
            }))
            setMovies(detailed.filter(Boolean))
        } catch (error) { console.error(error) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        loadInterests()
    }, [user])

    const handleRemove = async (movieId: string) => {
        if (!confirm("Remove from Interested list?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "interests", movieId))
            toast.success("Removed")
            loadInterests()
        } catch (e) { toast.error("Failed to remove") }
    }

    if (loading) return <Loader2 className="animate-spin" />
    if (movies.length === 0) return <p className="text-muted-foreground">No interested movies yet.</p>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {movies.map(m => (
                <div key={m.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <img src={m.posterUrl || "/placeholder.png"} alt={m.title} className="w-20 h-28 object-cover rounded bg-muted" />
                    <div className="flex flex-col justify-between flex-1">
                        <div>
                            <h4 className="font-semibold text-lg line-clamp-1">{m.title}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Release: {new Date(m.releaseDate?.toDate ? m.releaseDate.toDate() : m.releaseDate).toLocaleDateString()}
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
    )
}
