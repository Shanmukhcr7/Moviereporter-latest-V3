import { Metadata } from "next"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BlogClient } from "./blog-client"

// Function to fetch data for metadata
async function getBlog(id: string) {
  try {
    const docRef = doc(db, "artifacts/default-app-id/blogs", id)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return snap.data()
    }
  } catch (e) {
    console.error("Error fetching metadata:", e)
  }
  return null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const blog = await getBlog(id)

  if (!blog) {
    return {
      title: "Blog | Movie Reporter",
      description: "Read latest blogs on Movie Reporter",
    }
  }

  const title = blog.title || "Blog Article"
  const description = blog.summary || blog.content?.substring(0, 160) || "Read more on Movie Reporter"
  const image = blog.imageUrl || blog.image || "/placeholder.svg"

  return {
    title: `${title} | Movie Reporter`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [image],
    },
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BlogClient initialId={id} />
}
