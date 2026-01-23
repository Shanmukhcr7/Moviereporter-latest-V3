import { NextRequest, NextResponse } from "next/server";
import { uploadFile, deleteFile } from "@/lib/r2";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const oldUrl = formData.get("oldUrl") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 1. Validation
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
            return NextResponse.json({ error: "File too large (Max 10MB)" }, { status: 400 });
        }

        // 2. Delete Old Image
        if (oldUrl) {
            try {
                await deleteFile(oldUrl);
            } catch (e) {
                console.warn("Failed to delete old image:", e);
                // Non-blocking
            }
        }

        // 3. Save New Image
        const buffer = Buffer.from(await file.arrayBuffer());
        let finalBuffer = buffer;
        let finalContentType = file.type;

        // Profile Compression: Max 800x800
        try {
            const sharp = require('sharp');
            finalBuffer = await sharp(buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80, mozjpeg: true })
                .toBuffer();
            finalContentType = 'image/jpeg';
        } catch (e) {
            console.error("Profile compression failed:", e);
        }

        // Simple unique name
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`;

        // Upload to R2 (under user-profiles/ directory)
        const fileUrl = await uploadFile(finalBuffer, `user-profiles/${filename}`, finalContentType);



        return NextResponse.json({
            success: true,
            url: fileUrl,
            message: "Profile updated"
        });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    }
}

