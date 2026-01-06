"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

export function SavedNewsList() {
    const { user } = useAuth()
    const [news, setNews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadSaved = async () => {
        if (!user) {
            console.log("SavedNewsList: No user found")
            return
        }
        setLoading(true)
        try {
            console.log("SavedNewsList: Fetching for user", user.uid)
            const snap = await getDocs(collection(db, "artifacts/default-app-id/users", user.uid, "savedNews"))
            console.log("SavedNewsList: Found saved docs:", snap.size)

            const detailed = await Promise.all(snap.docs.map(async (d) => {
                console.log("SavedNewsList: Fetching news details for ID:", d.id)
                const nDoc = await getDoc(doc(db, "artifacts/default-app-id/news", d.id))
                if (nDoc.exists()) {
                    console.log("SavedNewsList: Found news doc:", d.id)
                    return { id: d.id, ...nDoc.data() }
                } else {
                    console.log("SavedNewsList: News doc missing for ID:", d.id)
                }
                return null
            }))
            const filtered = detailed.filter(Boolean)
            console.log("SavedNewsList: Final list size:", filtered.length)
            setNews(filtered)
        } catch (error) {
            console.error("SavedNewsList Error:", error)
        }
        finally { setLoading(false) }
    }

    useEffect(() => {
        loadSaved()
    }, [user])

    const handleRemove = async (newsId: string) => {
        if (!confirm("Remove this article from saved?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "savedNews", newsId))
            toast.success("Removed")
            loadSaved()
        } catch (e) { toast.error("Failed to remove") }
    }

    if (loading) return <Loader2 className="animate-spin" />
    if (news.length === 0) return <p className="text-muted-foreground">No saved news articles yet.</p>

    return (
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
    )
}
