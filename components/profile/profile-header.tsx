"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditProfileDialog } from "./edit-profile-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"
import { User, Mail, Phone, Calendar, Shield, Trophy, Pencil, Share } from "lucide-react"
import { collection, query, where, getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

export function ProfileHeader() {
    const { user, userData } = useAuth()
    const [editOpen, setEditOpen] = useState(false)
    const [pwdOpen, setPwdOpen] = useState(false)
    const [reviewCount, setReviewCount] = useState(0)
    const [levelInfo, setLevelInfo] = useState<{ currentLevel: string, nextLevel: string, nextThreshold: number, progress: number } | null>(null)

    useEffect(() => {
        if (user) {
            fetchUserStats()
        }
    }, [user])

    const fetchUserStats = async () => {
        try {
            const coll = collection(db, "artifacts/default-app-id/reviews")
            const q = query(coll, where("userId", "==", user!.uid), where("approved", "==", true)) // Assuming approved reviews count
            const snapshot = await getCountFromServer(q)
            const count = snapshot.data().count
            setReviewCount(count)
            calculateLevel(count)
        } catch (error) {
            console.error("Error fetching stats:", error)
        }
    }

    const calculateLevel = (count: number) => {
        // Levels: 0-5 (Novice), 5-20 (Film Buff), 20-50 (Critic), 50+ (Master)
        let currentLevel = "Novice"
        let nextLevel = "Film Buff"
        let prevThreshold = 0
        let nextThreshold = 5

        if (count >= 50) {
            currentLevel = "Master"
            nextLevel = "Legend"
            prevThreshold = 50
            nextThreshold = 100 // Cap
        } else if (count >= 20) {
            currentLevel = "Critic"
            nextLevel = "Master"
            prevThreshold = 20
            nextThreshold = 50
        } else if (count >= 5) {
            currentLevel = "Film Buff"
            nextLevel = "Critic"
            prevThreshold = 5
            nextThreshold = 20
        }

        const progress = Math.min(100, Math.max(0, ((count - prevThreshold) / (nextThreshold - prevThreshold)) * 100))

        setLevelInfo({
            currentLevel,
            nextLevel,
            nextThreshold,
            progress
        })
    }

    const formatDate = (dateVal?: any) => {
        if (!dateVal) return "N/A"
        try {
            // Handle Firestore Timestamp
            if (typeof dateVal.toDate === 'function') {
                return dateVal.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            }
            // Handle serialized Timestamp
            if (dateVal.seconds) {
                return new Date(dateVal.seconds * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            }
            // Handle String/Date
            const d = new Date(dateVal)
            return !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"
        } catch {
            return "N/A"
        }
    }

    const initials = userData?.displayName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm relative">
                <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <User className="h-5 w-5 md:h-6 md:w-6" />
                        Profile Details
                    </CardTitle>

                    {/* Share Button (Top Right) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 rounded-full hover:bg-muted"
                        onClick={async () => {
                            const username = userData?.username || user?.uid || "unknown"
                            const displayName = userData?.displayName || "User"
                            const role = userData?.role || "Member"
                            const homeUrl = window.location.origin
                            const registerUrl = `${window.location.origin}/login`
                            const photoURL = userData?.photoURL || user?.photoURL

                            const shareText = `🎬 Check out ${displayName} (@${username}) on Movie Reporter!
🏆 Badge: ${role}

Explore movies, reviews, and polls here:
${homeUrl}

Join our community:
${registerUrl}`

                            let shareData: any = {
                                title: `Join ${displayName} on Movie Reporter!`,
                                text: shareText,
                                url: homeUrl
                            }

                            // Try to add image if available
                            if (photoURL && navigator.share) {
                                try {
                                    const response = await fetch(photoURL)
                                    const blob = await response.blob()
                                    // Use a common extension and MIME type
                                    const file = new File([blob], "profile.png", { type: "image/png" })

                                    // Check if sharing files is supported
                                    // Safe check using optional chaining if TS complains or just direct call if confident
                                    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                                        shareData.files = [file]
                                    }
                                } catch (e) {
                                    console.error("Failed to fetch image for sharing", e)
                                }
                            }

                            // Helper: Copy text to clipboard
                            const copyToClipboard = () => {
                                navigator.clipboard.writeText(shareText)
                                toast.success("Message copied! Paste it after sharing.", { duration: 3000 })
                            }

                            if (navigator.share) {
                                try {
                                    // Copy first, in case the app ignores text
                                    copyToClipboard()

                                    // Small delay to ensure toast is seen/clipboard is set before UI context switch
                                    await new Promise(resolve => setTimeout(resolve, 100))
                                    await navigator.share(shareData)
                                } catch (err) {
                                    console.error("Error sharing:", err)
                                    // Already copied, maybe show error or just let it be
                                }
                            } else {
                                copyToClipboard()
                            }
                        }}
                    >
                        <Share className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-6 mt-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-3 relative">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-md">
                                <AvatarImage src={userData?.photoURL || user?.photoURL || ""} className="object-cover" />
                                <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
                            </Avatar>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md transition-opacity"
                                onClick={() => setEditOpen(true)}
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit Profile</span>
                            </Button>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <span className="font-bold text-xl">{userData?.displayName || userData?.username || "Guest Member"}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-bold tracking-wider mb-2">
                                {userData?.role || "Member"}
                            </span>

                            {/* User Level Progress */}
                            {levelInfo && (
                                <div className="w-full min-w-[180px] mt-2 bg-muted/40 p-2 rounded-lg border border-border/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                                            <Trophy className="h-3 w-3" /> {levelInfo.currentLevel}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{reviewCount} / {levelInfo.nextThreshold} Reviews</span>
                                    </div>
                                    <Progress value={levelInfo.progress} className="h-1.5" />
                                    <p className="text-[10px] text-center mt-1 text-muted-foreground">
                                        {levelInfo.nextThreshold - reviewCount} more to reach {levelInfo.nextLevel}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 flex-1 content-center">
                        <div className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-background">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Username</span>
                                <span className="font-medium truncate">{userData?.username || userData?.displayName || "N/A"}</span>
                            </div>
                        </div>

                        <div className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-background">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Email</span>
                                <span className="font-medium truncate" title={user?.email || ""}>{user?.email || "N/A"}</span>
                            </div>
                        </div>

                        <div className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-background">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Mobile</span>
                                <span className="font-medium">{userData?.phoneNumber || user?.phoneNumber || "N/A"}</span>
                            </div>
                        </div>

                        <div className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-background">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Joined</span>
                                <span className="font-medium">{formatDate(userData?.memberSince || userData?.createdAt || user?.metadata?.creationTime)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons (Between Profile Card and Tabs) */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => setPwdOpen(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                </Button>
            </div>

            <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
            <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
        </div>
    )
}
