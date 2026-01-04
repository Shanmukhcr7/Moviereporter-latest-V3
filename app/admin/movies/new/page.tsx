"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewMoviePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    poster: "",
    banner: "",
    trailer: "",
    synopsis: "",
    director: "",
    cast: "",
    genre: "",
    duration: "",
    releaseDate: "",
    industry: "Bollywood",
    language: "",
    status: "Released",
    rating: "0",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.role !== "admin") return

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "movies"), {
        ...formData,
        rating: Number.parseFloat(formData.rating),
        cast: formData.cast.split(",").map((c) => c.trim()),
        genre: formData.genre.split(",").map((g) => g.trim()),
        likes: 0,
        dislikes: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      router.push("/admin/movies")
    } catch (error) {
      console.error("Error adding movie:", error)
      alert("Failed to add movie")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/admin/movies" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Movies
        </Link>

        <h1 className="text-4xl font-bold mb-8">Add New Movie</h1>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Movie Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="director">Director *</Label>
                <Input
                  id="director"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg"
                  required
                >
                  <option value="Bollywood">Bollywood</option>
                  <option value="Hollywood">Hollywood</option>
                  <option value="Tollywood">Tollywood</option>
                  <option value="Kollywood">Kollywood</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="language">Language *</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="releaseDate">Release Date *</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rating">Rating (0-10) *</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg"
                  required
                >
                  <option value="Released">Released</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="OTT">OTT</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="genre">Genre (comma separated) *</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="Action, Drama, Thriller"
                required
              />
            </div>

            <div>
              <Label htmlFor="cast">Cast (comma separated) *</Label>
              <Input
                id="cast"
                value={formData.cast}
                onChange={(e) => setFormData({ ...formData, cast: e.target.value })}
                placeholder="Actor 1, Actor 2, Actor 3"
                required
              />
            </div>

            <div>
              <Label htmlFor="poster">Poster URL *</Label>
              <Input
                id="poster"
                type="url"
                value={formData.poster}
                onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="banner">Banner URL *</Label>
              <Input
                id="banner"
                type="url"
                value={formData.banner}
                onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="trailer">Trailer URL (YouTube)</Label>
              <Input
                id="trailer"
                type="url"
                value={formData.trailer}
                onChange={(e) => setFormData({ ...formData, trailer: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>

            <div>
              <Label htmlFor="synopsis">Synopsis *</Label>
              <Textarea
                id="synopsis"
                value={formData.synopsis}
                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                rows={6}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Adding..." : "Add Movie"}
              </Button>
              <Link href="/admin/movies" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
