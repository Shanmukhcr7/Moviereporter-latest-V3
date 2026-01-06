import { auth } from "@/lib/firebase"

export type LogAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "OTHER"
export type ResourceType = "Movie" | "Celebrity" | "News" | "Blog" | "User" | "Poll" | "Review" | "Award" | "Comment" | "Other"

export interface LogEntry {
    action: LogAction
    resourceType: ResourceType
    resourceId: string
    resourceTitle?: string
    details?: string
}

export async function logAdminAction(entry: LogEntry) {
    try {
        const user = auth.currentUser
        if (!user) return

        const payload = {
            adminId: user.uid,
            adminName: user.displayName || "Unknown Admin",
            adminEmail: user.email || "No Email",
            ...entry,
            timestamp: new Date().toISOString()
        }

        // Fire and forget - don't block UI
        fetch('/api/admin/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Failed to log action:", err))

    } catch (error) {
        console.error("Error in logAdminAction:", error)
    }
}
