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
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"

interface MovieCardProps {
  id: string
  title: string
  poster: string
  releaseDate: string
  rating?: number
  industry?: string
  isTopBoxOffice?: boolean
  enableInterest?: boolean
  genre?: string | string[]
}

export function MovieCard({ id, title, poster, releaseDate, rating, industry, isTopBoxOffice, enableInterest, genre }: MovieCardProps) {
  const { user } = useAuth()
  const [isInterested, setIsInterested] = useState(false)

  // Motion values for drag
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-10, 10])
  const opacityLike = useTransform(x, [50, 150], [0, 1])
  const opacityNope = useTransform(x, [-150, -50], [1, 0])

  // Local state to hide card if swiped (optional, for visual removal from list if desired)
  // For now we just snap back but perform action, or maybe just snap back.
  // Tinder style usually removes the card. But this is a grid. 
  // Let's just snap back and trigger action to be safe for now, as grid layout might break if we remove it.
  // We'll perform the action and show a big toast.

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

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (offset > 100) {
      // Swiped Right (Like)
      if (!isInterested) {
        await addToInterests()
      } else {
        toast.info("Already in your interests!")
      }
    } else if (offset < -100) {
      // Swiped Left (Hide/Pass)
      if (isInterested) {
        await removeFromInterests()
      } else {
        toast.info("Passed") // Feedback for pass
      }
    }
  }

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

  const toggleInterest = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInterested) await removeFromInterests()
    else await addToInterests()
  }

  return (
    <motion.div
      style={{ x, rotate, touchAction: "none" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className="h-full relative select-none"
      whileTap={{ cursor: "grabbing" }}
    >
      {/* Swipe Feedback Icons Overlay */}
      <motion.div style={{ opacity: opacityLike }} className="absolute top-4 right-4 z-50 pointer-events-none">
        <div className="border-4 border-green-500 rounded-lg p-2 px-4 bg-black/40 backdrop-blur-sm -rotate-12">
          <span className="text-green-500 font-bold text-2xl tracking-widest uppercase">LIKE</span>
        </div>
      </motion.div>
      <motion.div style={{ opacity: opacityNope }} className="absolute top-4 left-4 z-50 pointer-events-none">
        <div className="border-4 border-red-500 rounded-lg p-2 px-4 bg-black/40 backdrop-blur-sm rotate-12">
          <span className="text-red-500 font-bold text-2xl tracking-widest uppercase">NOPE</span>
        </div>
      </motion.div>

      <Link href={`/movie/${id}`} draggable={false} className="h-full block">
        <Card className="group h-full overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur relative">
          <div className="relative aspect-[2/3] overflow-hidden">
            <Image
              src={poster || "/placeholder.svg"}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
            />
            {isTopBoxOffice && <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">Top Box Office</Badge>}
            {industry && <Badge className="absolute top-2 left-2 bg-primary/90 backdrop-blur">{industry}</Badge>}
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
              {enableInterest && (
                <button
                  onClick={toggleInterest}
                  className={`text-foreground/80 hover:text-red-500 transition-colors z-20 relative ${isInterested ? "text-red-500 fill-current" : ""}`}
                  onPointerDown={(e) => e.stopPropagation()} // Allow clicking button without dragging card
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
              {rating && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {genre && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {Array.isArray(genre) ? genre.join(", ") : genre}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
