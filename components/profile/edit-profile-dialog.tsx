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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {user && userData && <EditProfileDialogContent open={open} onOpenChange={onOpenChange} user={user} userData={userData} />}
        </Dialog>
    )
}

function EditProfileDialogContent({ open, onOpenChange, user, userData }: any) {
    const [username, setUsername] = useState("")
    const [mobile, setMobile] = useState("")
    const [loading, setLoading] = useState(false)
    const [originalPhoto, setOriginalPhoto] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Validation State
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [usernameMsg, setUsernameMsg] = useState("")

    useEffect(() => {
        if (open && userData) {
            setUsername(userData.displayName || userData.username || "")
            setMobile(userData.phoneNumber || "")
            setOriginalPhoto(user?.photoURL || "")
            setPreviewUrl(user?.photoURL || "")
            setImageFile(null)
            setUsernameAvailable(null)
            setUsernameMsg("")
        }
    }, [open, userData, user])

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
                    const doc = snapshot.docs[0]
                    if (doc.id === user?.uid) {
                        setUsernameAvailable(true)
                        setUsernameMsg("")
                    } else {
                        setUsernameAvailable(false)
                        setUsernameMsg("Username is already taken")
                    }
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSave = async () => {
        if (!user) return
        if (!usernameAvailable && username !== user.displayName) {
            toast.error("Please choose a valid available username")
            return
        }

        setLoading(true)
        try {
            let finalPhotoUrl = originalPhoto

            // 1. Upload Image if changed
            if (imageFile) {
                const formData = new FormData()
                formData.append("file", imageFile)
                if (originalPhoto) {
                    formData.append("oldUrl", originalPhoto)
                }

                try {
                    // Try fetch to absolute URL first (Production)
                    const res = await fetch("https://movielovers.in/upload-profile.php", {
                        method: "POST",
                        body: formData
                    })

                    if (!res.ok) {
                        // Fallback to relative path
                        const resLocal = await fetch("/upload-profile.php", {
                            method: "POST",
                            body: formData
                        })
                        if (!resLocal.ok) throw new Error("Upload request failed")
                        const dataLocal = await resLocal.json()
                        if (dataLocal.success) {
                            finalPhotoUrl = dataLocal.url
                        } else {
                            throw new Error(dataLocal.error || "Upload failed")
                        }
                    } else {
                        const data = await res.json()
                        if (data.success) {
                            finalPhotoUrl = data.url
                        } else {
                            throw new Error(data.error || "Upload failed")
                        }
                    }
                } catch (e: any) {
                    console.error("Upload error", e)
                    // Try local fallback if absolute failed immediately
                    try {
                        const resLocal = await fetch("/upload-profile.php", {
                            method: "POST",
                            body: formData
                        })
                        if (!resLocal.ok) throw new Error("Upload request failed")
                        const dataLocal = await resLocal.json()
                        if (dataLocal.success) {
                            finalPhotoUrl = dataLocal.url
                        } else {
                            throw new Error(dataLocal.error)
                        }
                    } catch (innerE: any) {
                        throw new Error("Image upload failed: " + innerE.message)
                    }
                }
            }

            // 2. Update Auth Profile
            if (username !== user.displayName || finalPhotoUrl !== user.photoURL) {
                await updateProfile(user, {
                    displayName: username,
                    photoURL: finalPhotoUrl
                })
            }

            // 3. Update Firestore Doc
            const userRef = doc(db, "artifacts/default-app-id/users", user.uid)
            await updateDoc(userRef, {
                username: username,
                displayName: username,
                phoneNumber: mobile,
                mobileNumber: mobile,
                photoURL: finalPhotoUrl
            })

            toast.success("Profile updated successfully!")
            onOpenChange(false)
            // Reload to update UI
            window.location.reload()
        } catch (error: any) {
            console.error("Update failed", error)
            toast.error("Failed to update profile: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Make changes to your profile here.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                {/* Profile Pic Upload */}
                <div className="flex flex-col items-center gap-4 mb-4">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-border mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl || "/placeholder.svg"} alt="Profile" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="picture" className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Change Picture
                        </Label>
                        <Input id="picture" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>

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
    )
}
