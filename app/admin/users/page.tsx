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
import { Loader2, Shield, Trash2, CheckCircle, Ban } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // In a real app with many users, pagination is required.
        // For this dashboard, we fetch the last 50 signups or all if reasonable.
        const q = query(collection(db, "artifacts/default-app-id/users"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const toggleAdmin = async (user: any) => {
        const newRole = user.role === "admin" ? "user" : "admin"
        if (confirm(`Change role of ${user.displayName} to ${newRole}?`)) {
            await updateDoc(doc(db, "artifacts/default-app-id/users", user.id), { role: newRole })
            toast.success("User role updated")
        }
    }

    const deleteUser = async (id: string) => {
        // Deleting users from Firestore doesn't delete from Auth (requires Cloud Functions).
        // Here we just remove the detailed record or ban them.
        if (confirm("Are you sure? This removes their profile data.")) {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", id))
            toast.success("User profile deleted")
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
                            users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={user.photoURL} />
                                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {user.displayName}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                            {user.role || "user"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => toggleAdmin(user)}>
                                            <Shield className="h-4 w-4 mr-1" />
                                            {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
