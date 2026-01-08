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

async function getUser(username: string) {
    // This is a placeholder. Real implementation needs Admin SDK or specific public API.
    // Converting to client-side fetch for now to ensure it works without Admin SDK setup.
    return null
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
    const username = decodeURIComponent(params.username)
    return {
        title: `${username}'s Profile - Movie Lovers`,
        description: `Check out ${username}'s profile on Movie Lovers!`,
        openGraph: {
            title: `${username} on Movie Lovers`,
            description: `See ${username}'s reviews, badge, and activity.`,
            // images: ['/api/og/profile?username=' + username], // Advanced: generating image
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
