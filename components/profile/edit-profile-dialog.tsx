"use client"

import { useState, useEffect, useRef } from "react"
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
import Cropper from "react-easy-crop"
import getCroppedImg from "@/lib/canvasUtils"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    // Form States
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [mobile, setMobile] = useState("")
    const [bio, setBio] = useState("")
    const [loading, setLoading] = useState(false)

    // Image States
    const [originalPhoto, setOriginalPhoto] = useState("")
    const [imageFile, setImageFile] = useState<Blob | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Cropper States
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [showCropper, setShowCropper] = useState(false)
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

    // Validation State
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [usernameMsg, setUsernameMsg] = useState("")

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open && userData) {
            setUsername(userData.username || "")
            setDisplayName(userData.displayName || "")
            setMobile(userData.phoneNumber || "")
            setBio(userData.bio || "")
            setOriginalPhoto(user?.photoURL || "")
            setPreviewUrl(user?.photoURL || "")
            setImageFile(null)

            // Reset Cropper
            setShowCropper(false)
            setCropImageSrc(null)
            setZoom(1)
            setRotation(0)

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

            // Note: If username field didn't exist before, we assume current display name might be it, or check against doc
            // For simplicity, checking availability logic:
            if (user && userData?.username === username) {
                setUsernameAvailable(true)
                setUsernameMsg("")
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
    }, [username, user, userData])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.addEventListener("load", () => {
                setCropImageSrc(reader.result as string)
                setShowCropper(true) // Switch to crop view
            })
            reader.readAsDataURL(file)
            e.target.value = "" // Reset input
        }
    }

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    const handleCropSave = async () => {
        try {
            if (cropImageSrc && croppedAreaPixels) {
                const croppedBlob = await getCroppedImg(
                    cropImageSrc,
                    croppedAreaPixels,
                    rotation
                )
                if (croppedBlob) {
                    setImageFile(croppedBlob)
                    setPreviewUrl(URL.createObjectURL(croppedBlob))
                    setShowCropper(false) // Return to main view
                }
            }
        } catch (e) {
            console.error("Crop error", e)
            toast.error("Failed to crop image")
        }
    }

    const handleSave = async () => {
        if (!user) return
        // Only block if username is explicitly taken (false), allow null/true
        if (usernameAvailable === false) {
            toast.error("Please choose a different username")
            return
        }
        if (!displayName.trim()) {
            toast.error("Display Name is required")
            return
        }

        setLoading(true)
        try {
            let finalPhotoUrl = originalPhoto

            // 1. Upload Image (It's already a cropped Blob)
            if (imageFile) {
                const formData = new FormData()
                formData.append("file", imageFile, "profile.jpg")
                if (originalPhoto) {
                    formData.append("oldUrl", originalPhoto)
                }

                try {
                    const res = await fetch("/api/user/profile-upload", {
                        method: "POST",
                        body: formData
                    })

                    if (!res.ok) {
                        const errorText = await res.text()
                        throw new Error(`Server Error ${res.status}: ${errorText}`)
                    }

                    const data = await res.json()
                    if (data.success) {
                        finalPhotoUrl = data.url
                    } else {
                        throw new Error(data.error || "Upload failed")
                    }
                } catch (e: any) {
                    console.error("Upload error", e)
                    // Fallback not strictly needed if API matches, but keeping simple
                    throw new Error("Image upload failed: " + e.message)
                }
            }

            // 2. Update Auth Profile
            if (displayName !== user.displayName || finalPhotoUrl !== user.photoURL) {
                await updateProfile(user, {
                    displayName: displayName,
                    photoURL: finalPhotoUrl
                })
            }

            // 3. Update Firestore Doc
            const userRef = doc(db, "artifacts/default-app-id/users", user.uid)
            await updateDoc(userRef, {
                username: username,
                displayName: displayName,
                phoneNumber: mobile,
                mobileNumber: mobile,
                photoURL: finalPhotoUrl,
                bio: bio,
                updatedAt: new Date()
            })

            toast.success("Profile updated successfully!")
            onOpenChange(false)
            window.location.reload()
        } catch (error: any) {
            console.error("Update failed", error)
            toast.error("Failed to update profile: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
                <DialogTitle>{showCropper ? "Adjust Photo" : "Edit Profile"}</DialogTitle>
                {!showCropper && <DialogDescription>Update your profile details below.</DialogDescription>}
            </DialogHeader>

            {showCropper && cropImageSrc ? (
                <div className="flex flex-col gap-4">
                    <div className="relative w-full h-[300px] bg-black/90 rounded-md overflow-hidden">
                        <Cropper
                            image={cropImageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Zoom</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(v) => setZoom(v[0])}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowCropper(false)}>Cancel</Button>
                        <Button onClick={handleCropSave}>Done</Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 py-4">
                        {/* Profile Pic Upload */}
                        <div className="flex flex-col items-center gap-4 mb-2">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Avatar className="h-24 w-24 border-2 border-border">
                                    <AvatarImage src={previewUrl || userData?.photoURL || ""} className="object-cover" />
                                    <AvatarFallback className="text-lg">
                                        {(displayName || "U").charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-medium">Change</span>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-muted-foreground">Tap image to change</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <p className={`text-[10px] mt-1 absolute right-2 top-2 ${usernameAvailable === false ? "text-red-500" : "text-green-500"}`}>
                                    {checkingUsername ? "..." : usernameAvailable === false ? "Taken" : usernameAvailable === true ? "Available" : ""}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                className="resize-none"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="mobile">Mobile</Label>
                            <Input
                                id="mobile"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="+1234567890"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </DialogContent>
    )
}
