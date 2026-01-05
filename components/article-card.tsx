"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface ArticleCardProps {
  id: string
  title: string
  image: string
  author: string
  publishedAt: string
  category?: string
  excerpt?: string
  type: "news" | "blog"
}

export function ArticleCard({ id, title, image, author, publishedAt, category, excerpt, type }: ArticleCardProps) {
  return (
    <Link href={`/${type}/${id}`}>
      <Card className="group h-full overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {category && <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur">{category}</Badge>}
        </div>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {title}
          </h3>
          {excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{excerpt}</p>}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {(() => {
                  if (!publishedAt) return "N/A"
                  // Handle Firestore Timestamp or serialized
                  const dateVal: any = publishedAt
                  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString()
                  // Handle standard dates
                  const d = new Date(publishedAt)
                  return !isNaN(d.getTime()) ? d.toLocaleDateString() : "N/A"
                })()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
