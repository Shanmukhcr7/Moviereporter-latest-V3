import { Metadata } from "next"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { MovieClient } from "./movie-client"

// Function to fetch data for metadata
async function getMovie(id: string) {
  try {
    const docRef = doc(db, "artifacts/default-app-id/movies", id)
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
  const movie = await getMovie(id)

  if (!movie) {
    return {
      title: "Movie | Movie Reporter",
      description: "Movie details and reviews",
    }
  }

  const title = movie.title || "Movie Details"
  const description = movie.description || movie.summary || "Read reviews and details on Movie Reporter"
  const image = movie.poster || movie.posterUrl || movie.image || "/placeholder.svg"

  return {
    title: `${title} | Movie Reporter`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: image, // Ensure image is absolute URL if possible, but relative usually works if hosted same domain. 
          // However, for external images (firebase storage), it works fine.
          width: 800,
          height: 600,
          alt: title,
        }
      ],
      type: "website",
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
  return <MovieClient initialId={id} />
}
