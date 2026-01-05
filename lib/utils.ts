import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(url?: string | null) {
  if (!url) return "/placeholder.svg"
  // If it's a relative path starting with /uploads/, treat it as a remote image
  // This forces Next.js to fetch it via HTTP from Nginx, bypassing local filesystem check
  if (url.startsWith("/uploads/")) {
    return `https://movielovers.in${url}`
  }
  return url
}
