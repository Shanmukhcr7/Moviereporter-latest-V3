"use client"

import * as React from "react"
import Link from "next/link"
import { useAwardYears } from "@/hooks/use-award-years"

export function AwardWinnersDropdown({ isMobile = false }: { isMobile?: boolean }) {
    const { years, loading } = useAwardYears()

    if (loading) {
        // Show a small loader or skeleton
        return (
            <div className={`space-y-1 ${isMobile ? 'px-8 py-2' : 'px-4 py-2'}`}>
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
        )
    }

    if (years.length === 0) {
        // Fallback if no years found
        return (
            <Link
                href="/award-winners"
                className={isMobile ? "px-8 py-2 text-sm hover:text-primary transition-colors block" : "block px-4 py-2 text-sm hover:bg-accent"}
            >
                View Winners
            </Link>
        )
    }

    // Helper to chunk years for desktop layout if too many?
    // For now just list them. If > 10, maybe we limit? 
    // Let's show all for now but add scroll if needed in CSS.

    return (
        <>
            <Link href="/award-winners" className={`font-semibold  ${isMobile ? "px-8 py-2 block text-sm hover:text-primary transition-colors" : "block px-4 py-2 text-sm hover:bg-accent bg-accent/50"}`}>
                All Updates
            </Link>
            {years.map((year) => (
                <Link
                    key={year}
                    href={`/award-winners?year=${year}`}
                    className={
                        isMobile
                            ? "block px-8 py-2 text-sm hover:text-primary transition-colors text-muted-foreground"
                            : "block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    }
                >
                    {year} Winners
                </Link>
            ))}
        </>
    )
}
