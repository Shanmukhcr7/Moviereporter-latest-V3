import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

        // 2. Setup Directory
        // Use env var UPLOAD_DIR or default to Project Root / uploads / profiles
        // We move out of 'public' to separate content if needed, OR keep in public for easy serving
        // Admin route uses: process.cwd(), "public/uploads"
        // We will default to: process.cwd(), "public/uploads/profiles"
        // But if user set up "sibling uploads folder" logic, we might want to respect that via ENV or relative path.
        // For simplicity with existing Node setup: use public/uploads/profiles inside the app, 
        // unless UPLOAD_DIR is set.

        let uploadBase = process.env.UPLOAD_DIR
            ? process.env.UPLOAD_DIR
            : path.join(process.cwd(), "public/uploads");

        // If the user setup the "sibling" folder structure manually (/var/www/movie-reporter/uploads)
        // ensure we point there if they provide UPLOAD_DIR. 
        // Otherwise, standard Next.js behavior is inside public.

        const targetDir = path.join(uploadBase, "profiles");

        if (!existsSync(targetDir)) {
            await mkdir(targetDir, { recursive: true });
        }

        // 3. Delete Old Image
        if (oldUrl) {
            try {
                const urlObj = new URL(oldUrl);
                // Check if it belongs to this domain
                // Logic: Extract path, check if it exists in our targetDir
                // path: /uploads/profiles/abc.jpg
                const oldPathName = urlObj.pathname; // /uploads/profiles/filename.jpg
                const oldFileName = path.basename(oldPathName);

                // Only delete if it looks like a profile pic (simple check)
                if (oldPathName.includes("/profiles/")) {
                    const oldFilePath = path.join(targetDir, oldFileName);
                    if (existsSync(oldFilePath)) {
                        await unlink(oldFilePath);
                    }
                }
            } catch (e) {
                console.warn("Failed to delete old image:", e);
                // Non-blocking
            }
        }

        // 4. Save New Image
        const buffer = Buffer.from(await file.arrayBuffer());
        // Simple unique name
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`;
        // Note: For real compression we'd need 'sharp', but 'sharp' is a binary dependency 
        // that often breaks on random VPS without setup. We will skip server-side compression 
        // for now to strictly mimic Admin functionality (which likely just saves it).
        // If user wants compression later, we add 'sharp'.

        const filePath = path.join(targetDir, filename);
        await writeFile(filePath, buffer);

        // 5. Return URL
        // If we are using standard Next.js public serving:
        const fileUrl = `/uploads/profiles/${filename}`;

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
