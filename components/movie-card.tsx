"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Heart, X, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { doc, setDoc, deleteDoc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { getImageUrl } from "@/lib/utils"
// Motion imports removed
// import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"

interface MovieCardProps {
  id: string
  title: string
  poster: string
  releaseDate: string
  rating?: number
  industry?: string
  isTopBoxOffice?: boolean
  enableInterest?: boolean
  ottPlatforms?: string[]
  genre?: string | string[]
}

const ottPlatformImages: Record<string, string> = {
  "amazon prime": "/assets/ott/prime.webp",
  "netflix": "/assets/ott/netflix.webp",
  "youtube": "/assets/ott/youtube.webp",
  "jio hotstar": "/assets/ott/hotstar.webp",
  "disney+ hotstar": "/assets/ott/hotstar.webp",
  "sony liv": "/assets/ott/sonyliv.webp",
  "sun nxt": "/assets/ott/sunnxt.webp",
  "zee tv": "/assets/ott/zeetv.webp",
  "zee5": "/assets/ott/zeetv.webp",
  "etv win": "/assets/ott/etv.webp",
  "etv1": "/assets/ott/etv.webp",
  "aha": "/assets/ott/aha.webp",
  "jio cinema": "/assets/ott/jiocinema.webp",
  "mx player": "/assets/ott/mx-player.webp",
}

export function MovieCard({ id, title, poster, releaseDate, rating, industry, isTopBoxOffice, enableInterest, genre, ottPlatforms }: MovieCardProps) {
  const { user } = useAuth()
  const [isInterested, setIsInterested] = useState(false)

  // Motion values removed
  // const x = useMotionValue(0)
  // ...

  useEffect(() => {
    if (user && enableInterest) {
      const checkInterest = async () => {
        try {
          const docRef = doc(db, `artifacts/default-app-id/users/${user.uid}/interests/${id}`)
          const snap = await getDoc(docRef)
          if (snap.exists()) setIsInterested(true)
        } catch (e) {
          console.error("Error checking interest", e)
        }
      }
      checkInterest()
    }
  }, [user, id, enableInterest])

  // handleDragEnd removed

  const addToInterests = async () => {
    if (!user) {
      toast.info("Please login to save interest")
      return
    }
    try {
      const ref = doc(db, `artifacts/default-app-id/users/${user.uid}/interests/${id}`)
      await setDoc(ref, {
        movieId: id,
        title,
        posterUrl: poster || "",
        releaseDate: (() => {
          if (!releaseDate) return null;
          try {
            // If it's already a Timestamp-like object (has seconds), use it
            if ((releaseDate as any).seconds) return new Date((releaseDate as any).seconds * 1000);

            // If it handles toDate (actual Firestore Timestamp), use it
            if (typeof (releaseDate as any).toDate === 'function') return (releaseDate as any).toDate();

            // Try standard date parsing
            const d = new Date(releaseDate);
            return !isNaN(d.getTime()) ? d : null;
          } catch {
            return null;
          }
        })(),
        addedAt: Timestamp.now()
      })
      setIsInterested(true)
      toast.success("Added to interests")
    } catch (e) {
      toast.error("Failed to add")
    }
  }

  const removeFromInterests = async () => {
    if (!user) return
    try {
      const ref = doc(db, `artifacts/default-app-id/users/${user.uid}/interests/${id}`)
      await deleteDoc(ref)
      setIsInterested(false)
      toast.info("Removed from interests")
    } catch (e) {
      toast.error("Failed to remove")
    }
  }

  // Removed drag logic as requested

  const toggleInterest = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInterested) await removeFromInterests()
    else await addToInterests()
  }

  const renderPlatforms = (platforms: string[]) => {
    if (!platforms || platforms.length === 0) return null
    const maxShow = 3
    const show = platforms.slice(0, maxShow)
    const more = platforms.length - maxShow

    return (
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
        {show.map((p, i) => {
          const key = p.toLowerCase()
          const iconSrc = ottPlatformImages[key]

          if (iconSrc) {
            return (
              <div key={i} className="relative w-6 h-6 rounded-full overflow-hidden border border-border/50 bg-background" title={p}>
                <Image src={iconSrc} alt={p} fill className="object-cover" />
              </div>
            )
          }
          return (
            <Badge key={i} variant="secondary" className="text-[10px] px-1 h-5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {p}
            </Badge>
          )
        })}
        {more > 0 && (
          <Badge variant="outline" className="text-[10px] px-1 h-5 rounded-full flex items-center justify-center">+{more}</Badge>
        )}
      </div>
    )
  }

  return (
    <div className="h-full relative select-none">
      <Link href={`/movie/${id}`} draggable={false} className="h-full block">
        <Card className="group h-full overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur relative flex flex-col">
          <div className="relative aspect-[2/3] overflow-hidden shrink-0">
            <Image
              src={getImageUrl(poster || "/placeholder.svg")}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
            />
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
              {isTopBoxOffice && <Badge className="bg-yellow-500 text-black shadow-sm order-2">Top Box Office</Badge>}
              {typeof rating === 'number' && (
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-yellow-500 border border-white/10 shadow-sm order-1">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-bold text-xs">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {industry && <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur z-10">{industry}</Badge>}
          </div>
          <CardContent className="p-4 space-y-2 flex flex-col flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
              {enableInterest && (
                <button
                  onClick={toggleInterest}
                  className={`text-foreground/80 hover:text-red-500 transition-colors z-20 relative ${isInterested ? "text-red-500 fill-current" : ""}`}
                >
                  <Heart className={`h-5 w-5 ${isInterested ? "fill-current" : ""}`} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {(() => {
                    try {
                      if (!releaseDate) return 'TBD'
                      // Handle Firestore Timestamp
                      if (typeof (releaseDate as any).toDate === 'function') {
                        return (releaseDate as any).toDate().toLocaleDateString()
                      }
                      // Handle serialized Timestamp (seconds)
                      if ((releaseDate as any).seconds) {
                        return new Date((releaseDate as any).seconds * 1000).toLocaleDateString()
                      }
                      // Handle Date string/object
                      const d = new Date(releaseDate)
                      if (isNaN(d.getTime())) return 'TBD'
                      return d.toLocaleDateString()
                    } catch {
                      return 'TBD'
                    }
                  })()}
                </span>
              </div>
            </div>
            {genre && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {Array.isArray(genre) ? genre.join(", ") : genre}
              </p>
            )}

            {/* OTT Platforms - Pushed to bottom of card content */}
            <div className="mt-auto">
              {renderPlatforms(ottPlatforms || [])}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
