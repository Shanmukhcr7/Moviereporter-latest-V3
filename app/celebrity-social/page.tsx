"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { SocialPostCard } from "@/components/social-post-card"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp } from "lucide-react"

export default function CelebritySocialPage() {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const q = query(
                    collection(db, "artifacts/default-app-id/social_posts"),
                    orderBy("postedAt", "desc"), // Order by when celeb posted, not when we created
                    limit(20)
                )
                const snapshot = await getDocs(q)
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                setPosts(data)
            } catch (error) {
                console.error("Error fetching posts:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPosts()
    }, [])

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center mb-10 text-center">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl flex items-center gap-3">
                        Celebrity Social Media <TrendingUp className="w-8 h-8 text-primary" />
                    </h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 border rounded-xl bg-muted/20">
                        <p className="text-xl text-muted-foreground">No recent updates found.</p>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-20">
                        {posts.map((post) => (
                            <div key={post.id} className="break-inside-avoid">
                                <SocialPostCard post={post} />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
