"use client"

import type React from "react"
import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { addDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

const appId = "default-app-id" // Replace with actual app ID logic if dynamic

export default function PromotionPage() {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !message) {
      toast.warning("Please fill in all required fields: Name, Email, and Message.")
      return
    }

    setSubmitting(true)

    try {
      await addDoc(collection(db, `artifacts/${appId}/promotion_inquiries`), {
        name,
        company: company || null,
        email,
        mobile: mobile || null,
        message,
        createdAt: Timestamp.now(),
      })

      setName("")
      setCompany("")
      setEmail("")
      setMobile("")
      setMessage("")
      setIsSuccess(true)
      toast.success("Your promotion inquiry has been sent successfully! We will get back to you soon.")
    } catch (error: any) {
      console.error("Error submitting promotion inquiry:", error)
      toast.error(`Failed to send inquiry: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto mt-12 shadow-lg border-primary/20">
            <CardContent className="p-12 text-center">
              <div className="mb-6 flex justify-center">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-foreground">Inquiry Sent Successfully!</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Thank you for contacting Movie Lovers. Our team has received your promotion inquiry and will get back to you shortly.
              </p>
              <Button onClick={() => setIsSuccess(false)} variant="outline" className="min-w-[150px]">
                Send Another
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <section className="bg-card rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Promote Your Content with Movie Lovers</h2>

          <div className="prose dark:prose-invert max-w-none mb-8">
            <p className="text-lg">
              Are you an artist, production company, or content creator looking to promote your work? Movie Lovers offers unique opportunities to get your movies, music, or other entertainment content in front of a dedicated audience.
            </p>
            <p className="text-lg">
              Fill out the form below, and our team will get in touch to discuss potential promotion strategies tailored to your needs.
            </p>
          </div>

          <div className="mt-8 border-t pt-8">
            <h3 className="text-2xl font-bold mb-6 text-primary border-b-2 border-primary/20 pb-2 inline-block">
              Promotion Inquiry Form
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6 bg-background rounded-lg p-6 shadow-sm border border-border">
              <div className="space-y-2">
                <Label htmlFor="promo-name" className="text-base font-bold">Your Name:</Label>
                <Input
                  id="promo-name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-company" className="text-base font-bold">Company/Organization (Optional):</Label>
                <Input
                  id="promo-company"
                  placeholder="e.g., XYZ Productions"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-email" className="text-base font-bold">Email:</Label>
                <Input
                  id="promo-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-mobile" className="text-base font-bold">Mobile Number (Optional):</Label>
                <Input
                  id="promo-mobile"
                  type="tel"
                  placeholder="98XXXXXX10"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-message" className="text-base font-bold">Message / Promotion Details:</Label>
                <Textarea
                  id="promo-message"
                  rows={8}
                  placeholder="Tell us about your content and what you'd like to promote..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full min-h-[100px]"
                />
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-6 text-lg font-bold transition-all hover:-translate-y-px"
                >
                  {submitting ? "Sending..." : "Send Promotion Inquiry"}
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center md:text-left">
            <h3 className="text-xl font-bold mb-4">Contact Information</h3>
            <p className="mb-2">If you prefer to reach out directly, feel free to email us at:</p>
            <p>
              <strong>Email: </strong>
              <a href="mailto:admin@movielovers.in" className="text-primary hover:underline font-medium">
                admin@movielovers.in
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
