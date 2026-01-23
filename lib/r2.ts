import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    // It's okay to throw here if this is a required service, otherwise we could just log a warning.
    // For this migration, it's critical.
    console.error("Missing R2 Environment Variables");
}

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
});

export async function uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
): Promise<string> {
    try {
        console.log(`[R2] Starting upload for: ${fileName}, Content-Type: ${contentType}, Size: ${fileBuffer.length}`);

        const uploadParams = {
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        };

        console.log("[R2] Params:", { Bucket: R2_BUCKET_NAME, Key: fileName, ContentType: contentType });

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        console.log(`[R2] Upload successful for: ${fileName}`);

        // Construct the public URL
        // Remove trailing slash from R2_PUBLIC_URL if present
        const baseUrl = R2_PUBLIC_URL?.replace(/\/$/, "");
        const finalUrl = `${baseUrl}/${fileName}`;
        console.log(`[R2] Returning URL: ${finalUrl}`);

        return finalUrl;
    } catch (error: any) {
        console.error("[R2] Upload Error Full Object:", error);
        console.error("[R2] Error Message:", error.message);
        console.error("[R2] Error Code:", error.code);
        console.error("[R2] Metadata:", error.$metadata);
        throw error;
    }
}


export async function deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
        console.log("[R2] deleteFile called with empty URL");
        return;
    }

    try {
        console.log(`[R2] Attempting to delete file: ${fileUrl}`);

        // Robust Key Extraction
        // Parse the URL to handle potentially different protocols or query params
        const urlObj = new URL(fileUrl);
        const baseUrlObj = new URL(R2_PUBLIC_URL || "");

        // Verify hostname matches (ignoring protocol for flexibility, though usually https)
        if (urlObj.hostname !== baseUrlObj.hostname) {
            console.warn(`[R2] URL hostname mismatch. Got: ${urlObj.hostname}, Expected: ${baseUrlObj.hostname}`);
            // We might still want to proceed if it's a domain alias, but for now log warning.
            // If strict: return; 
            // Let's assume strict for safety unless user uses custom domain.
            if (!R2_PUBLIC_URL?.includes(urlObj.hostname)) {
                return;
            }
        }

        // Key is the pathname without the leading slash
        let key = urlObj.pathname;
        if (key.startsWith("/")) {
            key = key.substring(1);
        }

        // If key is empty or just root, abort
        if (!key) {
            console.error("[R2] Could not derive key from URL");
            return;
        }

        console.log(`[R2] Derived key: ${key}`);

        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command);
        console.log(`[R2] Delete successful for key: ${key}`);

    } catch (error: any) {
        console.error("[R2] Delete Error:", error);
        console.error("[R2] Error Details:", error.message);
    }
}

