"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SocialPostCard } from "@/components/social-post-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function PostDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [post, setPost] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPost = async () => {
            if (!params.id) return
            try {
                const docRef = doc(db, "artifacts/default-app-id/social_posts", params.id as string)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() })
                } else {
                    setPost(null)
                }
            } catch (error) {
                console.error("Error fetching post:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchPost()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="container max-w-2xl py-10 text-center">
                <h2 className="text-xl font-bold mb-4">Post not found</h2>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="container max-w-2xl py-6 pb-20">
            <Button
                variant="ghost"
                className="mb-4 gap-2 pl-0"
                onClick={() => router.back()}
            >
                <ArrowLeft className="w-4 h-4" /> Back to Feed
            </Button>

            <SocialPostCard post={post} isDetailView={true} />
        </div>
    )
}
