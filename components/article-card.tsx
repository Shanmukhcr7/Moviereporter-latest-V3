"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Bookmark } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useState, useEffect } from "react"
import { toast } from "sonner"

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
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(false)

  const getCollectionName = () => type === "news" ? "savedNews" : "savedBlogs"

  useEffect(() => {
    if (user) {
      const checkSaved = async () => {
        try {
          const docRef = doc(db, `artifacts/default-app-id/users/${user.uid}/${getCollectionName()}/${id}`)
          const snap = await getDoc(docRef)
          if (snap.exists()) setIsSaved(true)
        } catch (e) {
          console.error("Error checking saved status", e)
        }
      }
      checkSaved()
    }
  }, [user, id, type])

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.info("Please login to save")
      return
    }

    try {
      const collectionName = getCollectionName()
      const ref = doc(db, `artifacts/default-app-id/users/${user.uid}/${collectionName}/${id}`)
      if (isSaved) {
        await deleteDoc(ref)
        setIsSaved(false)
        toast.info("Removed from saved")
      } else {
        const data: any = {
          articleId: id,
          title,
          image: image || "",
          type,
          savedAt: Timestamp.now()
        }

        if (type === "news") data.newsId = id
        if (type === "blog") data.blogId = id

        await setDoc(ref, data)
        setIsSaved(true)
        toast.success("Article saved")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to update")
    }
  }

  return (
    <div className="group relative h-full">
      <Link href={`/${type}/${id}`} className="block h-full">
        <Card className="h-full p-0 gap-0 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur">
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
          <CardContent className="p-3 pt-3 space-y-1.5">
            <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {title}
            </h3>
            {excerpt && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{excerpt}</p>
                <span className="text-xs font-semibold text-primary group-hover:underline inline-flex items-center">
                  Read More &rarr;
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
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

      <button
        onClick={toggleSave}
        className={`absolute top-2 right-2 z-10 p-2 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/80 transition-colors ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
      </button>
    </div>
  )
}
