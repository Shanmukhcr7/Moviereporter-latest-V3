"use client"

import { useState } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface ImageUploadProps {
    value: string
    onChange: (url: string) => void
    disabled?: boolean
    folder?: string
}

export function ImageUpload({ value, onChange, disabled, folder = "uploads" }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Create a reference
            const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`)

            // Upload
            const snapshot = await uploadBytes(storageRef, file)

            // Get URL
            const downloadURL = await getDownloadURL(snapshot.ref)

            onChange(downloadURL)
            toast.success("Image uploaded successfully")
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Failed to upload image")
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = () => {
        onChange("")
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative aspect-video w-[200px] border rounded-md overflow-hidden bg-muted">
                        <Image
                            src={value}
                            alt="Upload"
                            fill
                            className="object-cover"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={handleRemove}
                            disabled={disabled}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center w-[200px] aspect-video border-2 border-dashed rounded-md bg-muted/50">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                )}

                <div className="flex-1">
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={disabled || isUploading}
                        className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                        Supported formats: .jpg, .png, .webp. Max size: 5MB.
                    </p>
                </div>
            </div>
            {isUploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading to Firebase...
                </div>
            )}
        </div>
    )
}
