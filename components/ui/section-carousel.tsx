"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SectionCarouselProps {
    children: React.ReactNode
    className?: string
}

export function SectionCarousel({ children, className }: SectionCarouselProps) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const [showLeftArrow, setShowLeftArrow] = React.useState(false)
    const [showRightArrow, setShowRightArrow] = React.useState(true)

    const checkScroll = () => {
        const container = scrollContainerRef.current
        if (container) {
            setShowLeftArrow(container.scrollLeft > 0)
            setShowRightArrow(
                Math.ceil(container.scrollLeft + container.clientWidth) < container.scrollWidth
            )
        }
    }

    React.useEffect(() => {
        checkScroll()
        window.addEventListener("resize", checkScroll)
        return () => window.removeEventListener("resize", checkScroll)
    }, [])

    const scroll = (direction: "left" | "right") => {
        const container = scrollContainerRef.current
        if (container) {
            const scrollAmount = direction === "left" ? -container.clientWidth / 2 : container.clientWidth / 2
            container.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
    }

    return (
        <div className="relative group">
            {showLeftArrow && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg flex bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={() => scroll("left")}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
            )}

            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className={cn(
                    "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 scroll-smooth",
                    className
                )}
            >
                {children}
            </div>

            {showRightArrow && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg flex bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={() => scroll("right")}
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            )}
        </div>
    )
}
