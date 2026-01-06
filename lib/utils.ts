import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(url?: string | null) {
  if (!url) return "/placeholder.svg"

  // If it's a relative path starting with /uploads/
  if (url.startsWith("/uploads/")) {
    // In development (localhost), return relative path so Next.js serves it from public/
    // Checks for window.location (client-side) to detect localhost
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return url
    }

    // In production, pointing to full URL might be needed if images are on a CDN or separate server
    // But if we are serving from the same domain (VPS), relative path is also fine.
    // However, the original code forced movielovers.in. Let's keep that only for PROD if needed, 
    // or arguably just return `url` if we want relative paths everywhere.
    // For now, let's just bypass the hardcoded domain on localhost.

    // Actually, if we are on the same domain, relative URL is always better.
    // The previous logic "This forces Next.js to fetch it via HTTP from Nginx" implies some specific setup.
    // I will simplify: If strictly /uploads/, just return it. Next.js <Image> handles relative paths fine.
    return url
  }

  // If no protocol, assume it might be a relative path or external without protocol (less likely)
  // Just return as is
  return url
}
