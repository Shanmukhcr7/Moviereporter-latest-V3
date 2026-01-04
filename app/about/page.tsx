"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Film } from "lucide-react"
import { useState } from "react"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AboutPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await addDoc(collection(db, "artifacts/default-app-id/feedback"), {
        name,
        email,
        feedback,
        createdAt: new Date().toISOString(),
      })

      setName("")
      setEmail("")
      setFeedback("")
      alert("Thank you for your feedback!")
    } catch (error) {
      console.error("[v0] Error submitting feedback:", error)
      alert("Failed to submit feedback. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Film className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">About Movie Reporter</h1>
            <p className="text-xl text-muted-foreground">
              Your ultimate destination for entertainment news and reviews
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-8 prose dark:prose-invert max-w-none">
              <h2>Who We Are</h2>
              <p>
                Movie Reporter is a comprehensive entertainment platform dedicated to bringing you the latest news,
                reviews, and insights from the world of cinema. We cover movies from all major film industries including
                Tollywood, Bollywood, Kollywood, Hollywood, and more.
              </p>

              <h2>What We Offer</h2>
              <ul>
                <li>Latest movie news and updates</li>
                <li>In-depth movie reviews and ratings</li>
                <li>Celebrity profiles and interviews</li>
                <li>Box office tracking and analysis</li>
                <li>Weekly magazine with curated content</li>
                <li>Interactive polls and award voting</li>
                <li>Community engagement through comments and discussions</li>
              </ul>

              <h2>Our Mission</h2>
              <p>
                We strive to be the most trusted and comprehensive source for entertainment news and reviews. Our
                mission is to keep movie enthusiasts informed, engaged, and connected to the films and stars they love.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Send Us Your Feedback</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required
                    rows={6}
                    placeholder="Share your thoughts, suggestions, or report issues..."
                  />
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
