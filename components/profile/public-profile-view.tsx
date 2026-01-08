"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, User, Calendar, MapPin, Film } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface UserData {
    username: string
    displayName?: string
    photoURL?: string
    role?: string
    createdAt?: any
    bio?: string
    favoriteGenres?: string[]
}

export function PublicProfileView({ username }: { username: string }) {
    const [profile, setProfile] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Try searching in 'users' collection
                const start = username.toLowerCase();
                // Note: Ideally usernames are unique and indexed. 
                // We will try to find a user where username == username
                const usersRef = collection(db, "users")
                const q = query(usersRef, where("username", "==", username), limit(1))
                const snapshot = await getDocs(q)

                if (!snapshot.empty) {
                    setProfile(snapshot.docs[0].data() as UserData)
                } else {
                    setError("User not found")
                }
            } catch (err) {
                console.error("Error fetching public profile:", err)
                setError("Failed to load profile")
            } finally {
                setLoading(false)
            }
        }

        if (username) fetchUser()
    }, [username])

    if (loading) return <div className="p-8 text-center">Loading profile...</div>
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>
    if (!profile) return null

    return (
        <div className="container max-w-2xl py-8">
            <Card className="shadow-lg border-primary/20 bg-card/60 backdrop-blur">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 relative">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-xl mx-auto">
                            <AvatarImage src={profile.photoURL} />
                            <AvatarFallback className="text-4xl">{profile.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Badge className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 px-3 py-1 text-sm">
                            {profile.role || "Member"}
                        </Badge>
                    </div>
                    <CardTitle className="text-3xl font-bold">{profile.displayName || profile.username}</CardTitle>
                    <p className="text-muted-foreground">@{profile.username}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Film className="h-4 w-4" />
                            <span>Movie Lover</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Joined recently</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 text-center space-y-4">
                <p className="text-muted-foreground">Join <strong>@{profile.username}</strong> on Movie Lovers today!</p>

                <div className="flex justify-center gap-4">
                    <Button asChild size="lg" className="font-bold">
                        <Link href="/signup">Join Community</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/">Explore Movies</Link>
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary/80 pt-4">
                    <Film className="h-5 w-5" />
                    <span>Movie Lovers India</span>
                </div>
            </div>
        </div>
    )
}
