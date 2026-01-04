"use client"

import { useState, useEffect } from "react"
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useAwardYears() {
    const [years, setYears] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchYears() {
            try {
                // Retrieve all winners to extract unique years
                // Optimized: We could create a separate 'years' metadata doc, 
                // but for now scanning is acceptable for moderate datasets.
                const q = query(collection(db, "artifacts/default-app-id/winners"), orderBy("year", "desc"))
                const snap = await getDocs(q)

                const yearsSet = new Set<string>()
                snap.forEach((doc) => {
                    const y = doc.data().year
                    if (y) yearsSet.add(String(y))
                })

                const sortedYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a))
                setYears(sortedYears)
            } catch (error) {
                console.error("Error fetching award years:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchYears()
    }, [])

    return { years, loading }
}
