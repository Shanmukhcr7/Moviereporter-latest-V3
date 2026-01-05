import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name.replace(/\s+/g, "-");
        const uniqueFilename = `${Date.now()}-${filename}`;

        // Determing upload directory
        // In Prod (VPS), we want /var/www/uploads
        // In Local, we might want ./public/uploads
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public/uploads");

        // Ensure directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, uniqueFilename);
        await writeFile(filePath, buffer);

        // Construct Public URL
        // If UPLOAD_URL_PREFIX is set (e.g., https://movielovers.in/uploads), use it.
        // Otherwise assume standard local path.
        const urlPrefix = process.env.UPLOAD_URL_PREFIX || "/uploads";
        const fileUrl = `${urlPrefix}/${uniqueFilename}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            filename: uniqueFilename
        });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Handle OPTIONS for CORS (if needed for cross-origin uploads)
export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
