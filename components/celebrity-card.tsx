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
        <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur">
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={displayImage}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <CardContent className="p-2 space-y-1 text-center">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
            <Badge variant="secondary" className="text-xs">
              {role}
            </Badge>
          </CardContent>
        </Card>
      </Link>

      {/* Like Button - Positioned absolutely over the card */}
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
    </div>
  )
}
