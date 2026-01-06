"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

export function CelebrityCard({ id, name, image, imageUrl, posterUrl, profileImage, role, isFavorite, onToggleFavorite, favoritesCount }: any) {
  const displayImage = image || imageUrl || posterUrl || profileImage || "/placeholder.svg"

  return (
    <div className="group relative h-full">
      <Link href={`/celebrity/${id}`} className="block h-full">
        <Card className="h-full p-0 gap-0 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur">
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={displayImage}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 flex flex-col justify-end items-center text-center">
              <h3 className="font-bold text-white text-base line-clamp-2 leading-tight drop-shadow-sm mb-1">{name}</h3>
              <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-0">
                {role}
              </Badge>
            </div>
          </div>
        </Card>
      </Link>

      {/* Like Button - Positioned absolutely over the card */}
      {/* Like Button - Positioned absolutely over the card */}
      {onToggleFavorite && (
        <Button
          variant="ghost"
          size="sm" // Smaller button
          className={`absolute top-2 right-2 z-10 h-8 px-2 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/80 transition-colors ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-primary'}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onToggleFavorite) onToggleFavorite(id)
          }}
        >
          <Heart className={`h-4 w-4 mr-1 ${isFavorite ? "fill-current" : ""}`} />
          <span className="text-xs font-medium">{favoritesCount !== undefined ? favoritesCount : ""}</span>
        </Button>
      )}
    </div>
  )
}
