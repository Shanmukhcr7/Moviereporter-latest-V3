"use client"

import { useState, useEffect } from "react"
import { collection, query, getDocs, addDoc, deleteDoc, updateDoc, doc, orderBy, serverTimestamp, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Bell, Trash2, CheckCircle, AlertTriangle, Info, Plus } from "lucide-react"

interface Notification {
    id: string
    title: string
    message: string
    type: "info" | "warning" | "success"
    active: boolean
    link?: string
    displayStyle?: "toast" | "banner"
    imageUrl?: string
    createdAt?: any
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const { userData } = useAuth()

    // Form State
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [type, setType] = useState<"info" | "warning" | "success">("info")
    const [link, setLink] = useState("")
    const [displayStyle, setDisplayStyle] = useState<"toast" | "banner">("toast")
    const [imageUrl, setImageUrl] = useState("")

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"))
            const snapshot = await getDocs(q)
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)))
        } catch (error) {
            console.error("Error fetching notifications:", error)
            toast.error("Failed to load notifications")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)

        try {
            await addDoc(collection(db, "notifications"), {
                title,
                message,
                type,
                link,
                displayStyle,
                imageUrl,
                active: true, // Auto-active on create
                createdAt: serverTimestamp(),
                createdBy: userData?.email
            })

            toast.success("Notification created and activated")
            setTitle("")
            setMessage("")
            setLink("")
            setImageUrl("")
            fetchNotifications()
        } catch (error) {
            console.error("Error creating notification:", error)
            toast.error("Failed to create notification")
        } finally {
            setIsCreating(false)
        }
    }

    const toggleActive = async (notification: Notification) => {
        try {
            const ref = doc(db, "notifications", notification.id)
            await updateDoc(ref, { active: !notification.active })
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, active: !n.active } : n))
            toast.success(`Notification ${!notification.active ? "activated" : "deactivated"}`)
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this notification?")) return
        try {
            await deleteDoc(doc(db, "notifications", id))
            setNotifications(prev => prev.filter(n => n.id !== id))
            toast.success("Notification deleted")
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Global Notifications</h1>
                    <p className="text-muted-foreground">Manage active announcements for all users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Creator Form */}
                <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            New Announcement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    placeholder="e.g. Maintenance Mode"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea
                                    placeholder="Short description for the user..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info (Blue)</SelectItem>
                                            <SelectItem value="warning">Warning (Yellow)</SelectItem>
                                            <SelectItem value="success">Success (Green)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Display Style</Label>
                                    <Select value={displayStyle} onValueChange={(v: any) => setDisplayStyle(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="toast">Toast (Top-Right)</SelectItem>
                                            <SelectItem value="banner">Banner (Center Modal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {displayStyle === 'banner' && (
                                <div className="space-y-2">
                                    <Label>Image URL (Optional)</Label>
                                    <Input
                                        placeholder="https://imgur.com/..."
                                        value={imageUrl}
                                        onChange={e => setImageUrl(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Link (Optional)</Label>
                                <Input
                                    placeholder="/movies/new-release"
                                    value={link}
                                    onChange={e => setLink(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full gap-2" disabled={isCreating}>
                                <Bell className="h-4 w-4" />
                                {isCreating ? "Publishing..." : "Publish Now"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold">History</h2>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-muted/20">
                            <p className="text-muted-foreground">No notifications created yet.</p>
                        </div>
                    ) : (
                        notifications.map(item => (
                            <Card key={item.id} className={`transition-opacity ${!item.active ? 'opacity-60 bg-muted/30' : 'border-primary/50'}`}>
                                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="flex gap-4 items-start">
                                        <div className={`p-2 rounded-full mt-1 shrink-0 ${item.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                                            item.type === 'success' ? 'bg-green-500/10 text-green-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {item.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                                                item.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
                                                    <Info className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                {item.title}
                                                {item.active && <Badge variant="default" className="bg-green-500">Active</Badge>}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">{item.message}</p>
                                            {item.link && <p className="text-xs text-primary mt-1">{item.link}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                            <Label htmlFor={`active-${item.id}`} className="text-xs text-muted-foreground">
                                                {item.active ? "On" : "Off"}
                                            </Label>
                                            <Switch
                                                id={`active-${item.id}`}
                                                checked={item.active}
                                                onCheckedChange={() => toggleActive(item)}
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
