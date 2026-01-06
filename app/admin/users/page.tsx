import { useState, useEffect } from "react"
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, limit, startAfter, where, QueryDocumentSnapshot, getDoc } from "firebase/firestore"
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
import { Loader2, Shield, Trash2, Lock, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { logAdminAction } from "@/lib/logger"
import { useAuth } from "@/lib/auth-context"
import { AdminSearch } from "@/components/admin/admin-search"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ITEMS_PER_PAGE = 5

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const { user: currentUser } = useAuth()

    // Search & Filter
    const [filteredUsers, setFilteredUsers] = useState<any[]>([])
    const [searchIndex, setSearchIndex] = useState<{ id: string, label: string, value: string }[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [roleFilter, setRoleFilter] = useState("all")

    useEffect(() => {
        fetchUsers(true)
        fetchSearchIndex()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [roleFilter, users])

    const fetchUsers = async (isInitial = false) => {
        try {
            if (isInitial) {
                setLoading(true)
                setHasMore(true)
                setIsSearching(false)
            } else {
                setLoadingMore(true)
            }

            let q = query(
                collection(db, "artifacts/default-app-id/users"),
                orderBy("createdAt", "desc"), // Ensure you have this index or fallback to default sort
                limit(ITEMS_PER_PAGE)
            )

            // Fallback if createdAt doesn't exist on all docs, use email or simple list
            // Note: Users created via Auth might not have createdAt in Firestore unless explicitly saved.
            // If query fails due to missing field/index, we might need a simpler fetch.

            if (!isInitial && lastVisible && !isSearching) {
                q = query(
                    collection(db, "artifacts/default-app-id/users"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastVisible),
                    limit(ITEMS_PER_PAGE)
                )
            }

            const snapshot = await getDocs(q)
            const newUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            if (isInitial) {
                setUsers(newUsers)
            } else {
                setUsers(prev => [...prev, ...newUsers])
            }

            setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null)

            if (snapshot.docs.length < ITEMS_PER_PAGE) {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error fetching users:", error)
            // Fallback for missing 'createdAt' index or field
            // Try fetching without sort if it failed
            if (isInitial) fetchFallback()
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const fetchFallback = async () => {
        try {
            const q = query(collection(db, "artifacts/default-app-id/users"), limit(ITEMS_PER_PAGE))
            const snapshot = await getDocs(q)
            const newUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setUsers(newUsers)
            setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null)
        } catch (e) {
            console.error("Fallback failed", e)
        }
    }

    const fetchSearchIndex = async () => {
        try {
            const q = query(collection(db, "artifacts/default-app-id/users"))
            const snapshot = await getDocs(q)
            const index = snapshot.docs.map(d => {
                const data = d.data()
                return {
                    id: d.id,
                    label: `${data.displayName || 'Unknown'} (${data.email})`,
                    value: d.id
                }
            })
            setSearchIndex(index)
        } catch (e) {
            console.error("Error fetching search index", e)
        }
    }

    const handleSearchSelect = async (userId: string) => {
        setLoading(true)
        setIsSearching(true)
        try {
            const local = users.find(u => u.id === userId)
            if (local) {
                setFilteredUsers([local]) // Set directly for search view
                setLoading(false)
                return
            }

            // Fetch specific
            const docRef = doc(db, "artifacts/default-app-id/users", userId)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                const userData = { id: docSnap.id, ...docSnap.data() }
                setFilteredUsers([userData])
                // We don't add to main list to avoid pagination conflicts
            }
        } catch (error) {
            toast.error("Error finding user")
        } finally {
            setLoading(false)
        }
    }

    const handleClearSearch = () => {
        setIsSearching(false)
        setRoleFilter("all")
        // Resetting to main list happens in useEffect [users]
    }

    const applyFilters = () => {
        if (isSearching) return // Search overrides filters

        let result = users
        if (roleFilter !== "all") {
            // "admin" covers both generic admin and super_admin if we want?
            // User requested "Filter", usually by specific role.
            if (roleFilter === "admin_only") {
                result = result.filter(u => u.role === "admin" || u.role === "super_admin")
            } else {
                result = result.filter(u => (u.role || "user") === roleFilter)
            }
        }
        setFilteredUsers(result)
    }

    const toggleAdmin = async (targetUser: any) => {
        const newRole = targetUser.role === "admin" ? "user" : "admin"

        if (targetUser.role === "super_admin") {
            toast.error("Cannot modify Super Admin privileges.")
            return
        }

        if (confirm(`Change role of ${targetUser.displayName} to ${newRole}?`)) {
            await updateDoc(doc(db, "artifacts/default-app-id/users", targetUser.id), { role: newRole })
            toast.success("User role updated")

            // Update local state
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u))
            if (isSearching) {
                setFilteredUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u))
            }

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
        if (targetUser.role === "super_admin") {
            toast.error("Cannot delete Super Admin.")
            return
        }

        if (confirm("Are you sure? This removes their profile data.")) {
            await deleteDoc(doc(db, "artifacts/default-app-id/users", targetUser.id))
            toast.success("User profile deleted")

            setUsers(prev => prev.filter(u => u.id !== targetUser.id))
            setFilteredUsers(prev => prev.filter(u => u.id !== targetUser.id))

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Users</h1>
                    <p className="text-muted-foreground">Manage user access and roles.</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => fetchUsers(true)} title="Refresh">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-background p-4 rounded-lg border">
                <div className="flex-1">
                    <AdminSearch
                        items={searchIndex}
                        onSelect={handleSearchSelect}
                        placeholder="Search users by name or email..."
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter} disabled={isSearching}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                </Select>
                {isSearching && (
                    <Button variant="ghost" onClick={handleClearSearch}>Clear Search</Button>
                )}
            </div>

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
                        ) : filteredUsers.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No users found.</TableCell></TableRow>
                        ) : (
                            filteredUsers.map(user => {
                                const isSuperAdmin = user.role === "super_admin"
                                const isMe = currentUser?.uid === user.id
                                const canEdit = !isSuperAdmin

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
                                        <TableCell>
                                            {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : "-"}
                                        </TableCell>
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

            {!loading && hasMore && !isSearching && roleFilter === 'all' && (
                <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={() => fetchUsers(false)} disabled={loadingMore}>
                        {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Load More
                    </Button>
                </div>
            )}
        </div>
    )
}
