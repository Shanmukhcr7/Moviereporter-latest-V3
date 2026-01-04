"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { doc, updateDoc, collection, query, where, getDocs, limit } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EditProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const { user, userData } = useAuth()
    const [username, setUsername] = useState("")
    const [mobile, setMobile] = useState("")
    const [loading, setLoading] = useState(false)

    // Validation State
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [usernameMsg, setUsernameMsg] = useState("")

    useEffect(() => {
        if (open && userData) {
            setUsername(userData.displayName || userData.username || "")
            setMobile(userData.phoneNumber || "")
            setUsernameAvailable(null)
            setUsernameMsg("")
        }
    }, [open, userData])

    // Debounced Username Check
    useEffect(() => {
        const checkAvailability = async () => {
            if (!username || username.length < 3) {
                setUsernameAvailable(false)
                setUsernameMsg("Username must be at least 3 characters")
                return
            }

            if (user && username === user.displayName) {
                setUsernameAvailable(true)
                setUsernameMsg("") // It's their own
                return
            }

            setCheckingUsername(true)
            try {
                const q = query(collection(db, "artifacts/default-app-id/users"), where("username", "==", username), limit(1))
                const snapshot = await getDocs(q)
                if (snapshot.empty) {
                    setUsernameAvailable(true)
                    setUsernameMsg("Username is available")
                } else {
                    setUsernameAvailable(false)
                    setUsernameMsg("Username is already taken")
                }
            } catch (err: any) {
                console.error("Error checking username", err)
                setUsernameMsg("Error checking availability")
            } finally {
                setCheckingUsername(false)
            }
        }

        const timer = setTimeout(checkAvailability, 500)
        return () => clearTimeout(timer)
    }, [username, user])


    const handleSave = async () => {
        if (!user) return
        if (!usernameAvailable && username !== user.displayName) {
            toast.error("Please choose a valid available username")
            return
        }

        setLoading(true)
        try {
            // 1. Update Auth Profile
            if (username !== user.displayName) {
                await updateProfile(user, { displayName: username })
            }

            // 2. Update Firestore Doc
            const userRef = doc(db, "artifacts/default-app-id/users", user.uid)
            await updateDoc(userRef, {
                username: username,
                displayName: username, // Sync both fields if schema varies
                phoneNumber: mobile,
                mobileNumber: mobile // Legacy field name sync
            })

            toast.success("Profile updated successfully! Refresh to see changes.") // Ideally context updates
            onOpenChange(false)
        } catch (error: any) {
            console.error("Update failed", error)
            toast.error("Failed to update profile: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Username
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <p className={`text-xs mt-1 ${usernameAvailable ? "text-green-500" : "text-red-500"}`}>
                                {checkingUsername ? "Checking..." : usernameMsg}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="mobile" className="text-right">
                            Mobile
                        </Label>
                        <Input
                            id="mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="col-span-3"
                            placeholder="+1234567890"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave} disabled={loading || (username !== user?.displayName && !usernameAvailable)}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
