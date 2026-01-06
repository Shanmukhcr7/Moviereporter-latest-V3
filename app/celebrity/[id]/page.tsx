import { Metadata } from "next"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { CelebrityClient } from "./celebrity-client"

// Function to fetch data for metadata
async function getCelebrity(id: string) {
  try {
    const docRef = doc(db, "artifacts/default-app-id/celebrities", id)
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
  const celeb = await getCelebrity(id)

  if (!celeb) {
    return {
      title: "Celebrity | Movie Reporter",
      description: "Celebrity details and filmography",
    }
  }

  const title = celeb.name || "Celebrity Details"
  const description = celeb.bio || celeb.description || "Read more on Movie Reporter"
  const image = celeb.profileImage || celeb.image || celeb.imageUrl || "/placeholder.svg"

  return {
    title: `${title} | Movie Reporter`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: image,
          width: 800,
          height: 600,
          alt: title,
        },
      ],
      type: "profile",
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
  return <CelebrityClient initialId={id} />
}
