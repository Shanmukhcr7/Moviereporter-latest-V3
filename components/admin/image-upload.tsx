"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    onRemove: () => void
    disabled?: boolean
    className?: string
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled,
    className
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validation
        if (!file.type.startsWith("image/")) {
            toast.error("Invalid file type", { description: "Please upload an image file (JPG, PNG, WEBP)" })
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error("File too large", { description: "Max file size is 5MB" })
            return
        }

        try {
            setIsUploading(true)
            const formData = new FormData()
            formData.append("file", file)

            // Determine API Enpoint: Use ENV var or default to relative path
            const apiUrl = process.env.NEXT_PUBLIC_UPLOAD_API_URL || "/api/upload"

            const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Upload failed")
            }

            onChange(data.url)
            toast.success("Image uploaded successfully")

        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Upload failed", { description: "Something went wrong. Please try again." })
        } finally {
            setIsUploading(false)
            // Reset input so sticking the same file works again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    return (
        <div className={cn("space-y-4 w-full flex flex-col items-center justify-center", className)}>
            <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-4 hover:bg-accent/50 transition-colors w-full h-64 flex flex-col items-center justify-center cursor-pointer overflow-hidden",
                    disabled && "opacity-50 cursor-not-allowed",
                    value ? "border-primary" : "border-muted-foreground/25"
                )}
            >
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    disabled={disabled || isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                ) : value ? (
                    <div className="relative w-full h-full">
                        <Image
                            fill
                            src={value}
                            alt="Upload"
                            className="object-contain"
                        />
                        <div className="absolute top-2 right-2">
                            <Button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRemove()
                                }}
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImagePlus className="h-10 w-10" />
                        <p className="font-medium">Click to upload image</p>
                        <p className="text-xs">JPG, PNG, WEBP (Max 5MB)</p>
                    </div>
                )}
            </div>
        </div>
    )
}
