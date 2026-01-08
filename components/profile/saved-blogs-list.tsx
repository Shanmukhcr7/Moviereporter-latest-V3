"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, deleteDoc, query, orderBy, limit, startAfter } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

export function SavedBlogsList() {
    const { user } = useAuth()
    const [blogs, setBlogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [lastDoc, setLastDoc] = useState<any>(null)
    const [hasMore, setHasMore] = useState(true)
    const BATCH_SIZE = 4

    const fetchDetail = async (d: any) => {
        const bDoc = await getDoc(doc(db, "artifacts/default-app-id/blogs", d.id))
        if (bDoc.exists()) {
            return { id: d.id, ...bDoc.data() }
        }
        return null
    }

    const loadSaved = async (isInitial = false) => {
        if (!user) return
        if (isInitial) {
            setLoading(true)
            setHasMore(true)
        } else {
            setLoadingMore(true)
        }

        try {
            // Trying orderBy "addedAt". If this fails due to missing index/field on legacy data, 
            // consistent pagination might require an index adjustment or fallback.
            let q = query(
                collection(db, "artifacts/default-app-id/users", user.uid, "savedBlogs"),
                orderBy("addedAt", "desc"),
                limit(BATCH_SIZE + 1)
            )

            if (!isInitial && lastDoc) {
                q = query(
                    collection(db, "artifacts/default-app-id/users", user.uid, "savedBlogs"),
                    orderBy("addedAt", "desc"),
                    startAfter(lastDoc),
                    limit(BATCH_SIZE + 1)
                )
            }

            const snap = await getDocs(q)

            if (snap.empty) {
                if (isInitial) setBlogs([])
                setHasMore(false)
                setLoading(false)
                setLoadingMore(false)
                return
            }

            const gotMore = snap.docs.length > BATCH_SIZE
            setHasMore(gotMore)

            const docsToProcess = gotMore ? snap.docs.slice(0, BATCH_SIZE) : snap.docs
            setLastDoc(docsToProcess[docsToProcess.length - 1])

            const detailed = await Promise.all(docsToProcess.map(fetchDetail))
            const filtered = detailed.filter(Boolean)

            if (isInitial) {
                setBlogs(filtered)
            } else {
                setBlogs(prev => [...prev, ...filtered])
            }
        } catch (error) {
            console.error("Error loading saved blogs (likely missing addedAt or index):", error)
            // Fallback? Or just let it serve as hint to user/dev.
        }
        finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        loadSaved(true)
    }, [user])

    const handleRemove = async (blogId: string) => {
        if (!confirm("Remove this blog from saved?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "savedBlogs", blogId))
            toast.success("Removed")
            // Local update
            setBlogs(prev => prev.filter(b => b.id !== blogId))
        } catch (e) { toast.error("Failed to remove") }
    }

    if (loading) return <Loader2 className="animate-spin" />
    if (blogs.length === 0) return <p className="text-muted-foreground">No saved blogs yet.</p>

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blogs.map(b => (
                    <div key={b.id} className="border rounded-lg overflow-hidden flex flex-col">
                        <img src={b.imageUrl || "/placeholder.png"} alt={b.title} className="w-full h-40 object-cover bg-muted" />
                        <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-semibold line-clamp-1">{b.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                {new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm line-clamp-2 text-muted-foreground flex-1 mb-4">
                                {b.description}
                            </p>
                            <div className="flex gap-2 mt-auto">
                                <Link href={`/news/${b.id}`} passHref className="w-full">
                                    <Button variant="outline" size="sm" className="w-full">View</Button>
                                </Link>
                                <Button variant="destructive" size="sm" onClick={() => handleRemove(b.id)}>Remove</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={() => loadSaved(false)} disabled={loadingMore}>
                        {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}
        </div>
    )
}
