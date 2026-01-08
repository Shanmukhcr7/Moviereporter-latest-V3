import { MetadataRoute } from 'next'
import { collection, getDocs, query, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const revalidate = 3600 // Revalidate at most every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://movielovers.in'

    // 1. Static Routes
    const staticRoutes = [
        '',
        '/movies-info',
        '/movies',
        '/upcoming-releases',
        '/top-boxoffice',
        '/celebrities',
        '/news',
        '/weekly-magazine',
        '/about',
        '/vote-enroll',
        '/polls',
        '/privacy-policy', // Assuming these exist or should exist
        '/terms-of-service',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Routes - Fetch concurrently
    const [movies, celebrities, news, blogs, users] = await Promise.all([
        fetchAllDocs('movies'),
        fetchAllDocs('celebrities'),
        fetchAllDocs('news'),
        fetchAllDocs('blogs'),
        fetchAllDocs('users'),
    ])

    const movieUrls = movies.map((id) => ({
        url: `${baseUrl}/movie/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const celebrityUrls = celebrities.map((id) => ({
        url: `${baseUrl}/celebrity/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    const newsUrls = news.map((id) => ({
        url: `${baseUrl}/news/${id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }))

    const blogUrls = blogs.map((id) => ({
        url: `${baseUrl}/blog/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    const userUrls = users.map((id) => ({
        url: `${baseUrl}/u/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
    }))

    return [
        ...staticRoutes,
        ...movieUrls,
        ...celebrityUrls,
        ...newsUrls,
        ...blogUrls,
        ...userUrls
    ]
}

// Helper to fetch all IDs from a collection
// We use a high limit to get "maximum" pages as requested. 
// In a real huge app, we'd paginate or use a server-side script, but for build-time/ISR sitemap this is efficient enough for thousands of items.
async function fetchAllDocs(collectionName: string) {
    try {
        const colRef = collection(db, `artifacts/default-app-id/${collectionName}`)
        // Fetch only IDs to be lightweight. 
        // Note: client SDK fetches full docs, but we strip them immediately.
        // Ideally we'd use an Admin SDK for listDocuments(), but strictly client SDK here.
        const snapshot = await getDocs(query(colRef, limit(5000)))
        return snapshot.docs.map((doc) => doc.id)
    } catch (error) {
        console.error(`Error generating sitemap for ${collectionName}:`, error)
        return []
    }
}
