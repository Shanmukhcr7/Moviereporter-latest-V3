"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface TrailerModalProps {
    isOpen: boolean
    onClose: () => void
    videoUrl: string // Expecting a YouTube embed URL or similar
    posterUrl: string
    title: string
}

export function TrailerModal({ isOpen, onClose, videoUrl, posterUrl, title }: TrailerModalProps) {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    // Parse YouTube ID to ensure clean embed if needed (simple check)
    const getEmbedUrl = (url: string) => {
        if (!url) return ""
        if (url.includes("embed")) return url
        const v = url.split("v=")[1]
        if (v) {
            const id = v.split("&")[0]
            return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`
        }
        return url
    }

    const finalVideoUrl = getEmbedUrl(videoUrl)

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={onClose}
                >
                    {/* Ambient Lighting Background */}
                    <div className="absolute inset-0 overflow-hidden z-0 opacity-40">
                        <Image
                            src={posterUrl}
                            alt="Ambience"
                            fill
                            className="object-cover blur-[100px] scale-150 animate-pulse"
                        />
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden z-10 mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header / Dismiss */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-20">
                            <h3 className="text-white font-bold text-lg drop-shadow-md">{title} - Official Trailer</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20 pointer-events-auto rounded-full"
                                onClick={onClose}
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Video Player */}
                        {finalVideoUrl ? (
                            <iframe
                                src={finalVideoUrl}
                                title={`${title} Trailer`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full border-0"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-neutral-900">
                                <Play className="w-16 h-16 mb-4 opacity-50" />
                                <p>Trailer not available</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
