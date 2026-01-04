"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Trophy, MessageSquare, Star, Award } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function UserBadges() {
    const { user, userData } = useAuth()
    const [badges, setBadges] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            calculateBadges()
        } else {
            setBadges([])
            setLoading(false)
        }
    }, [user])

    const calculateBadges = async () => {
        if (!user) return

        const newBadges = []

        // 1. Cinephile: Joined (always awarded for now if user exists)
        newBadges.push({
            label: "Cinephile",
            icon: <VideoIcon className="h-3 w-3" />,
            color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
        })

        try {
            // 2. Top Critic: > 5 Reviews
            // We need to count reviews. 
            // Optimized: Use getCountFromServer if possible, or just check local stats if we had them.
            // For now, let's just query.
            const reviewsQ = query(collection(db, "artifacts/default-app-id/reviews"), where("userId", "==", user.uid))
            const reviewsSnap = await getCountFromServer(reviewsQ)
            const reviewCount = reviewsSnap.data().count

            if (reviewCount >= 5) {
                newBadges.push({
                    label: `Top Critic`, // (${reviewCount})
                    icon: <Star className="h-3 w-3" />,
                    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                })
            }

            // 3. Conversation Starter: > 5 Comments
            const commentsQ = query(collection(db, "artifacts/default-app-id/comments"), where("userId", "==", user.uid))
            const commentsSnap = await getCountFromServer(commentsQ)
            const commentCount = commentsSnap.data().count

            // Also check article_comments if we want to combine, but let's stick to 'comments' collection for now or both.
            // Let's just use the 'comments' collection we used in News page logic for simplicity.

            if (commentCount >= 5) {
                newBadges.push({
                    label: "Chatter",
                    icon: <MessageSquare className="h-3 w-3" />,
                    color: "bg-green-500/10 text-green-500 border-green-500/20"
                })
            }

        } catch (error) {
            console.error("Error calculating badges:", error)
        }

        setBadges(newBadges)
        setLoading(false)
    }

    if (loading || badges.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {badges.map((badge, i) => (
                <Badge key={i} variant="outline" className={`gap-1 text-xs py-0.5 px-2 ${badge.color}`}>
                    {badge.icon}
                    {badge.label}
                </Badge>
            ))}
        </div>
    )
}

function VideoIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    )
}
