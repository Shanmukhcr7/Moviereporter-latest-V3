import { Metadata } from "next"
import { notFound } from "next/navigation"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase" // Ensure this is server-safe or move logic to client
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, User, Calendar } from "lucide-react"

// Since we can't easily use client SDK in server component without setup, 
// I'll make this a client component that fetches data, OR use a client wrapper.
// For simplicity and "rich share" (metadata), it SHOULD be server-side if possible.
// But Firebase Client SDK in Next.js Server Components is tricky. 
// Let's make it a client component for rendering, but with static metadata if possible? 
// Actually, for social sharing (WhatsApp preview), we NEED server-side metadata.
// I will create a basic Server Component that generates Metadata.

// NOTE: This assumes 'username' is stored in 'users' collection. 
// If separate artifacts/users, need to check paths.

// Helper to fetch user for metadata
async function getUser(username: string) {
    try {
        const usersRef = collection(db, "artifacts/default-app-id/users")
        const q = query(usersRef, where("username", "==", username), limit(1))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
            return snapshot.docs[0].data()
        }
    } catch (e) {
        console.error("Error fetching user metadata:", e)
    }
    return null
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
    const username = decodeURIComponent(params.username)
    const user = await getUser(username)

    const displayName = user?.displayName || username
    const photoURL = user?.photoURL || "https://movielovers.in/placeholder-user.jpg" // Fallback image
    const description = user?.bio || `Check out ${displayName}'s profile, reviews, and activity on Movie Lovers.`

    return {
        title: `${displayName} (@${username}) - Movie Lovers`,
        description: description,
        openGraph: {
            title: `${displayName} on Movie Lovers`,
            description: description,
            url: `https://movielovers.in/u/${username}`,
            siteName: "Movie Lovers",
            images: [
                {
                    url: photoURL,
                    width: 800,
                    height: 800,
                    alt: `${displayName}'s Profile Photo`,
                },
            ],
            type: "profile",
        }
    }
}

export default function PublicProfilePage({ params }: { params: { username: string } }) {
    return (
        <PublicProfileView username={decodeURIComponent(params.username)} />
    )
}

// Client Component for fetching/viewing
import { PublicProfileView } from "@/components/profile/public-profile-view"
