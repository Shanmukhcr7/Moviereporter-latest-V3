"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Shield, Trash2, CheckCircle, Ban, Lock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { logAdminAction } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"

// List of protected emails (The Owner/First Admin)
// In a real app, this might come from ENV or a "super_admin" role check.
// Using SUPER_ADMIN protection via role check mainly, but hardcoding email is a good fallback for Owner.
const OWNER_EMAIL = "shanmukh@movielovers.in" // Replace with actual owner email if known, or rely on logic

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { user: currentUser, userData } = useAuth()

    useEffect(() => {
        const q = query(collection(db, "artifacts/default-app-id/users"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const toggleAdmin = async (targetUser: any) => {
        const newRole = targetUser.role === "admin" ? "user" : "admin"

        // Protection Logic
        if (targetUser.role === "super_admin") {
            toast.error("Cannot modify Super Admin privileges.")
            return
        }

        // Specific Owner Protection (if we know email)
        // if (targetUser.email === OWNER_EMAIL && currentUser?.email !== OWNER_EMAIL) { ... }

        if (confirm(`Change role of ${targetUser.displayName} to ${newRole}?`)) {
            await updateDoc(doc(db, "artifacts/default-app-id/users", targetUser.id), { role: newRole })

            toast.success("User role updated")

            // Log Action
            await logAdminAction({
                action: "UPDATE",
                resourceType: "User",
                resourceId: targetUser.id,
                resourceTitle: targetUser.displayName || targetUser.email,
                details: `Changed role to ${newRole}`
            })
        }
    }

    const deleteUser = async (targetUser: any) => {
        if (targetUser.role === "super_admin" || targetUser.role === "admin") {
            // Basic protection: Don't let admins delete other admins easily without super admin check
            // But for now, specifically protect super_admin
            if (targetUser.role === "super_admin") {
                toast.error("Cannot delete Super Admin.")
                return
            }
        }

        if (confirm("Are you sure? This removes their profile data.")) {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", targetUser.id))
            toast.success("User profile deleted")

            // Log Action
            await logAdminAction({
                action: "DELETE",
                resourceType: "User",
                resourceId: targetUser.id,
                resourceTitle: targetUser.displayName || targetUser.email,
                details: `Deleted user profile`
            })
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Users</h1>
            <div className="border rounded-md bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : (
                            users.map(user => {
                                const isSuperAdmin = user.role === "super_admin"
                                const isMe = currentUser?.uid === user.id
                                const canEdit = !isSuperAdmin // Basic rule: Nobody edits Super Admin (except maybe another SA, but simplifying)

                                return (
                                    <TableRow key={user.id}>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.photoURL} />
                                                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span>{user.displayName}</span>
                                                {isMe && <span className="text-[10px] text-muted-foreground">(You)</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={isSuperAdmin ? "default" : (user.role === "admin" ? "secondary" : "outline")} className={isSuperAdmin ? "bg-purple-600 hover:bg-purple-700" : ""}>
                                                {isSuperAdmin ? (
                                                    <span className="flex items-center gap-1">
                                                        <Lock className="h-3 w-3" /> Super Admin
                                                    </span>
                                                ) : (user.role || "user")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleAdmin(user)}
                                                disabled={!canEdit || isMe}
                                                className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                                            >
                                                <Shield className="h-4 w-4 mr-1" />
                                                {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                                            </Button>

                                            {/* Only show delete for non-admins usually, or add more logic */}
                                            {user.role !== "super_admin" && !isMe && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteUser(user)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
