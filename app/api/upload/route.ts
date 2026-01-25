import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/r2";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        let folder = formData.get("folder") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate/Sanitize folder
        const allowedFolders = ["blog-images", "celebrity-images", "movie-images", "news-images", "user-profiles", "polls", "celebrity-social-media", "trailer-thumbnails"];
        if (!folder || !allowedFolders.includes(folder)) {
            folder = "uploads";
        }



        const buffer = Buffer.from(await file.arrayBuffer());
        let finalBuffer = buffer;
        let finalContentType = file.type;

        // Compression Logic
        // If image is > 1MB or simply large, compress it.
        // We'll trust sharp to optimize.
        if (file.size > 1024 * 1024 || file.type.startsWith("image/")) {
            try {
                // Resize to max 1920x1080, convert to jpeg (or webp) with 80% quality
                // This ensures < 1MB for almost all web images
                const sharp = require('sharp');
                finalBuffer = await sharp(buffer)
                    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80, mozjpeg: true }) // mozjpeg for better compression
                    .toBuffer();

                finalContentType = 'image/jpeg';
                // Update filename extension if needed, but R2 doesn't care much. 
                // Best practice: change to .jpg if we force jpeg
            } catch (e) {
                console.error("Compression failed, uploading original:", e);
                // Fallback to original
            }
        }

        const filename = file.name.replace(/\s+/g, "-").replace(/\.[^/.]+$/, "") + ".jpg"; // Force .jpg extension
        const uniqueFilename = `${Date.now()}-${filename}`;

        // Upload to R2
        const fileUrl = await uploadFile(finalBuffer, `${folder}/${uniqueFilename}`, finalContentType);



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
