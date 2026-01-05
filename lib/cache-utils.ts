export const CACHE_DURATION_MINUTES = 15

export interface CacheItem<T> {
    data: T
    timestamp: number
    version: string
}

const CACHE_VERSION = "v1"

export const getFromCache = <T>(key: string): T | null => {
    if (typeof window === "undefined") return null
    try {
        const itemStr = window.localStorage.getItem(key)
        if (!itemStr) return null

        const item: CacheItem<T> = JSON.parse(itemStr)
        const now = Date.now()

        // Check version
        if (item.version !== CACHE_VERSION) {
            window.localStorage.removeItem(key)
            return null
        }

        // Check expiration (15 mins)
        if (now - item.timestamp > CACHE_DURATION_MINUTES * 60 * 1000) {
            window.localStorage.removeItem(key)
            return null
        }

        return item.data
    } catch (error) {
        console.warn("Error reading from cache:", error)
        return null
    }
}

export const saveToCache = <T>(key: string, data: T) => {
    if (typeof window === "undefined") return
    try {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION,
        }
        window.localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
        console.warn("Error saving to cache:", error)
        // Handle quota exceeded? Clear old keys? For now just warn.
    }
}

export const clearCacheByKey = (key: string) => {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(key)
}
