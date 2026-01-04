"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Removed unused interface
export function CelebrityListCard({
    id,
    name,
    role,
    image,
    imageUrl,
    posterUrl,
    profileImage,
    favoritesCount,
    isFavorite,
    onToggleFavorite,
    disabled = false,
}: any) { // Using any for props to flexibly handle incoming data fields

    const displayImage = image || imageUrl || posterUrl || profileImage || "/placeholder.svg"

    return (
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0 flex items-center h-full">
                {/* Left: Image */}
                <div className="relative h-32 w-32 shrink-0 sm:h-40 sm:w-40">
                    <Image
                        src={displayImage}
                        alt={name}
                        fill
                        className="object-cover rounded-l-xl"
                    />
                </div>

                {/* Center: Info */}
                <div className="flex-1 px-4 py-2 flex flex-col justify-center min-w-0">
                    <h3 className="font-bold text-lg sm:text-xl truncate text-foreground">{name}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base truncate">{role}</p>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col items-center justify-between h-full py-4 pr-4 gap-4">
                    <div className="flex flex-col items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "rounded-full hover:bg-transparent hover:scale-110 transition-transform",
                                isFavorite ? "text-destructive" : "text-muted-foreground"
                            )}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onToggleFavorite(id)
                            }}
                            disabled={disabled}
                        >
                            <Heart className={cn("h-6 w-6 sm:h-7 sm:w-7", isFavorite && "fill-current")} />
                        </Button>
                        <span className="text-xs font-medium text-foreground">{favoritesCount}</span>
                    </div>

                    <Link href={`/celebrity/${id}`}>
                        <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
                            View More
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
