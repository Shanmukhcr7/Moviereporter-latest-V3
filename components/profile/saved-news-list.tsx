"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, deleteDoc, query, orderBy, limit, startAfter } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

export function SavedNewsList() {
    const { user } = useAuth()
    const [news, setNews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [lastDoc, setLastDoc] = useState<any>(null)
    const [hasMore, setHasMore] = useState(true)
    const BATCH_SIZE = 4

    const fetchDetail = async (d: any) => {
        const nDoc = await getDoc(doc(db, "artifacts/default-app-id/news", d.id))
        if (nDoc.exists()) {
            return { id: d.id, ...nDoc.data() }
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
            // orderBy "addedAt" for consistency with saved items methodology
            let q = query(
                collection(db, "artifacts/default-app-id/users", user.uid, "savedNews"),
                orderBy("addedAt", "desc"),
                limit(BATCH_SIZE + 1)
            )

            if (!isInitial && lastDoc) {
                q = query(
                    collection(db, "artifacts/default-app-id/users", user.uid, "savedNews"),
                    orderBy("addedAt", "desc"),
                    startAfter(lastDoc),
                    limit(BATCH_SIZE + 1)
                )
            }

            const snap = await getDocs(q)

            if (snap.empty) {
                if (isInitial) setNews([])
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
                setNews(filtered)
            } else {
                setNews(prev => [...prev, ...filtered])
            }
        } catch (error) {
            console.error("Error loading saved news:", error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        loadSaved(true)
    }, [user])

    const handleRemove = async (newsId: string) => {
        if (!confirm("Remove this article from saved?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "savedNews", newsId))
            toast.success("Removed")
            // Local update
            setNews(prev => prev.filter(n => n.id !== newsId))
        } catch (e) { toast.error("Failed to remove") }
    }

    if (loading) return <Loader2 className="animate-spin" />
    if (news.length === 0) return <p className="text-muted-foreground">No saved news articles yet.</p>

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.map(n => (
                    <div key={n.id} className="border rounded-lg overflow-hidden flex flex-col">
                        <img src={n.imageUrl || n.image || "/placeholder.png"} alt={n.title} className="w-full h-40 object-cover bg-muted" />
                        <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-semibold line-clamp-1">{n.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : "Recent"}
                            </p>
                            <p className="text-sm line-clamp-2 text-muted-foreground flex-1 mb-4">
                                {n.summary}
                            </p>
                            <div className="flex gap-2 mt-auto">
                                <Link href={`/news/${n.id}`} passHref className="w-full">
                                    <Button variant="outline" size="sm" className="w-full">View</Button>
                                </Link>
                                <Button variant="destructive" size="sm" onClick={() => handleRemove(n.id)}>Remove</Button>
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
