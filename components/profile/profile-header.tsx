"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditProfileDialog } from "./edit-profile-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"
import { User, Mail, Phone, Calendar, Shield } from "lucide-react"

export function ProfileHeader() {
    const { user, userData } = useAuth()
    const [editOpen, setEditOpen] = useState(false)
    const [pwdOpen, setPwdOpen] = useState(false)

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const initials = userData?.displayName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"

    return (
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 border-b">
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <User className="h-5 w-5 md:h-6 md:w-6" />
                    Profile Details
                </CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setEditOpen(true)}>
                        Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setPwdOpen(true)}>
                        Change Password
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-6 mt-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-20 w-20 md:h-28 md:w-28 border-4 border-background shadow-sm">
                        {/* If we had a photoURL, we'd use it. Currently relying on fallback or google photo */}
                        <AvatarImage src={user?.photoURL || ""} className="object-cover" />
                        <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center">
                        <span className="font-medium text-lg">{userData?.displayName || "User"}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-bold tracking-wider">
                            {userData?.role || "Member"}
                        </span>
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
                            <span className="font-medium">{userData?.phoneNumber || "N/A"}</span>
                        </div>
                    </div>

                    <div className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-background">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-medium uppercase">Joined</span>
                            <span className="font-medium">{formatDate(userData?.memberSince)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>

            <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
            <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
        </Card>
    )
}
