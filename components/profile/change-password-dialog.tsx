"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { auth } from "@/lib/firebase"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
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

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const { user } = useAuth()
    const [currentPwd, setCurrentPwd] = useState("")
    const [newPwd, setNewPwd] = useState("")
    const [confirmPwd, setConfirmPwd] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!user || !user.email) return

        if (newPwd !== confirmPwd) {
            toast.error("New passwords do not match")
            return
        }
        if (newPwd.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setLoading(true)
        try {
            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPwd)
            await reauthenticateWithCredential(user, credential)

            // Update
            await updatePassword(user, newPwd)

            toast.success("Password updated successfully")
            onOpenChange(false)
            setCurrentPwd("")
            setNewPwd("")
            setConfirmPwd("")
        } catch (error: any) {
            console.error("Password change failed", error)
            if (error.code === 'auth/wrong-password') {
                toast.error("Current password is incorrect")
            } else {
                toast.error("Failed to change password: " + error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your current password to confirm changes.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="current-pwd">Current Password</Label>
                        <Input
                            id="current-pwd"
                            type="password"
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-pwd">New Password</Label>
                        <Input
                            id="new-pwd"
                            type="password"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                        <Input
                            id="confirm-pwd"
                            type="password"
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Change Password
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
