"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, X, Image as ImageIcon, UploadCloud } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface PHPImageUploadProps {
    value: string
    onChange: (url: string) => void
    disabled?: boolean
    uploadUrl?: string // URL to the PHP script on Hostinger
}

// Default to a placeholder if not set. User must configure this.
const DEFAULT_UPLOAD_URL = "https://your-hostinger-domain.com/upload.php"

export function PHPImageUpload({
    value,
    onChange,
    disabled,
    uploadUrl = DEFAULT_UPLOAD_URL
}: PHPImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate type
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            // NOTE: This fetch will fail if the User hasn't set up the PHP script yet.
            // We will handle the error gracefully.
            const response = await fetch(uploadUrl, {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (!response.ok || data.error) {
                throw new Error(data.error || "Upload failed")
            }

            onChange(data.url)
            toast.success("Image uploaded successfully!")
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Failed to upload. Ensure your Hostinger PHP script is running.")
            // FALLBACK FOR DEMO: If upload fails (likely CORS or no server), simple fake it? 
            // No, user specifically asked for Hostinger. We must show error.
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = () => {
        onChange("")
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-background/50">
                {value ? (
                    <div className="relative w-40 h-40 border rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                            src={value}
                            alt="Uploaded content"
                            fill
                            className="object-cover"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={handleRemove}
                            disabled={disabled}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-md bg-muted/30 text-muted-foreground flex-shrink-0">
                        <UploadCloud className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-xs text-center px-2">Upload to Hostinger</span>
                    </div>
                )}

                <div className="flex-1 space-y-4">
                    <div>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={disabled || isUploading}
                            className="cursor-pointer file:cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Max size: 5MB. Formats: JPG, PNG, WEBP.
                        </p>
                    </div>

                    {/* Configuration Helper */}
                    <div className="text-xs p-3 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20">
                        <strong>Setup Required:</strong> Make sure <code>upload.php</code> is deployed at: <br />
                        <code className="text-[10px] break-all">{uploadUrl}</code>
                    </div>
                </div>
            </div>

            {isUploading && (
                <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading to server...
                </div>
            )}
        </div>
    )
}
