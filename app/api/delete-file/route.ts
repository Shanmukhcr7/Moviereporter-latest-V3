import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "@/lib/r2";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url } = body;

        console.log(`[API] /api/delete-file called with URL: ${url}`);

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Security check: Only allow deleting files from our own R2 domain
        const r2Domain = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") || "";

        // Ensure URL to delete is also normalized for check, or just check check start
        if (!url.startsWith(r2Domain)) {
            console.error(`[API] Domain mismatch. Expected start: ${r2Domain}, Got: ${url}`);
            return NextResponse.json({ error: "Invalid URL domain" }, { status: 403 });
        }

        console.log("[API] Calling r2.deleteFile...");
        await deleteFile(url);

        return NextResponse.json({ success: true, message: "File deleted" });
    } catch (error: any) {
        console.error("Delete Endpoint Error:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}

