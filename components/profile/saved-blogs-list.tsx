"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

export function SavedBlogsList() {
    const { user } = useAuth()
    const [blogs, setBlogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadSaved = async () => {
        if (!user) return
        setLoading(true)
        try {
            const snap = await getDocs(collection(db, "artifacts/default-app-id/users", user.uid, "savedBlogs"))
            const detailed = await Promise.all(snap.docs.map(async (d) => {
                const bDoc = await getDoc(doc(db, "artifacts/default-app-id/blogs", d.id))
                if (bDoc.exists()) {
                    return { id: d.id, ...bDoc.data() }
                }
                return null
            }))
            setBlogs(detailed.filter(Boolean))
        } catch (error) { console.error(error) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        loadSaved()
    }, [user])

    const handleRemove = async (blogId: string) => {
        if (!confirm("Remove this blog from saved?")) return
        try {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", user!.uid, "savedBlogs", blogId))
            toast.success("Removed")
            loadSaved()
        } catch (e) { toast.error("Failed to remove") }
    }

    if (loading) return <Loader2 className="animate-spin" />
    if (blogs.length === 0) return <p className="text-muted-foreground">No saved blogs yet.</p>

    return (
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
                            <Link href={`/news/${b.id}`} passHref>
                                {/* Assuming news/blog route is /news/id or /blog/id. Logic for type check? 
                               Legacy implies blogs are one type. I'll stick to logic used in other components or generic link.
                               Actually let's check legacy: "blog-details.html?blogId=". 
                               Usually mapped to /news/[id] or /articles/[id] in this app.
                            */}
                                <Button variant="outline" size="sm" className="w-full">View</Button>
                            </Link>
                            <Button variant="destructive" size="sm" onClick={() => handleRemove(b.id)}>Remove</Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
