import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "admin-activity.jsonl")

// Ensure log directory exists
async function ensureLogDir() {
    try {
        await fs.access(LOG_DIR)
    } catch {
        await fs.mkdir(LOG_DIR, { recursive: true })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // Validate required fields
        if (!body.adminId || !body.action || !body.resourceType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        await ensureLogDir()

        // Create log line
        const logLine = JSON.stringify(body) + "\n"

        // Append to file
        await fs.appendFile(LOG_FILE, logLine, "utf8")

        // In development, also log to console for instant feedback
        if (process.env.NODE_ENV === "development") {
            console.log("[AdminLog]", JSON.stringify(body, null, 2))
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error writing log:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get("limit") || "100")
        // Filters could be added here if reading file efficiently

        try {
            await fs.access(LOG_FILE)
        } catch {
            return NextResponse.json({ logs: [] })
        }

        const content = await fs.readFile(LOG_FILE, "utf8")
        const lines = content.trim().split("\n")

        // Parse lines to JSON, reverse to show newest first, and slice
        const logs = lines
            .map(line => {
                try { return JSON.parse(line) } catch { return null }
            })
            .filter(Boolean)
            .reverse()
            .slice(0, limit)

        return NextResponse.json({ logs })
    } catch (error) {
        console.error("Error reading logs:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
