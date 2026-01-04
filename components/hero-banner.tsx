"use client"

import type React from "react"
import { limit } from "firebase/firestore" // Import limit from firebase/firestore

import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

interface BannerItem {
  id: string
  title: string
  image: string
  description: string
  type: "news" | "blog"
  isPromotion: boolean
  publishedAt?: number // Added publishedAt for sorting
}

export function HeroBanner() {
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  useEffect(() => {
    async function fetchBanners() {
      try {
        const items: BannerItem[] = []

        // Fetch promotional news
        const newsQuery = query(
          collection(db, "artifacts/default-app-id/news"),
          where("isPromotion", "==", true),
          limit(10), // Use limit here
        )
        const newsSnapshot = await getDocs(newsQuery)
        newsSnapshot.docs.forEach((doc, index) => {
          const data = doc.data()
          items.push({
            id: doc.id,
            title: data.title,
            image: data.image || data.imageUrl || data.bannerImage || data.bannerImageUrl || "",
            description: data.excerpt || "",
            type: "news",
            isPromotion: true,
            publishedAt: data.publishedAt?.toMillis(),
          })
        })

        // Fetch promotional blogs
        const blogsQuery = query(
          collection(db, "artifacts/default-app-id/blogs"),
          where("isPromotion", "==", true),
          limit(10), // Use limit here
        )
        const blogsSnapshot = await getDocs(blogsQuery)
        blogsSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          items.push({
            id: doc.id,
            title: data.title,
            image: data.image || data.imageUrl || data.bannerImage || data.bannerImageUrl || "",
            description: data.excerpt || "",
            type: "blog",
            isPromotion: true,
            publishedAt: data.publishedAt?.toMillis(),
          })
        })

        items.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
        setBanners(items.slice(0, 7))
      } catch (error) {
        console.error("[v0] Error fetching banners:", error)
      }
    }

    fetchBanners()
  }, [])

  useEffect(() => {
    if (banners.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      handleNext()
    }
    if (touchStart - touchEnd < -75) {
      handlePrevious()
    }
  }

  if (banners.length === 0) {
    return (
      <div className="relative h-[500px] md:h-[600px] bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
    )
  }

  const currentBanner = banners[currentIndex]

  return (
    <div
      className="relative h-[500px] md:h-[600px] overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner Image */}
      <div className="absolute inset-0">
        <Image
          src={currentBanner.image || "/placeholder.svg?height=600&width=1200"}
          alt={currentBanner.title}
          fill
          sizes="100vw"
          className="object-cover transition-transform duration-700"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-end pb-16">
        <div className="max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
            FEATURED
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white text-balance leading-tight">
            {currentBanner.title}
          </h1>
          <p className="text-lg text-white/90 line-clamp-2">{currentBanner.description}</p>
          <Link href={`/${currentBanner.type}/${currentBanner.id}`}>
            <Button size="lg" className="mt-4">
              Read More
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors z-20"
        onClick={handlePrevious}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors z-20"
        onClick={handleNext}
        aria-label="Next slide"
      >
        <ChevronRight className="h-8 w-8" />
      </Button>


      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  )
}
