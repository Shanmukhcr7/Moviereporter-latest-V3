"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <HelpCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Help & Support</h1>
            <p className="text-xl text-muted-foreground">We're here to help you get the most out of Movie Reporter</p>
          </div>

          <Card>
            <CardContent className="p-8 prose dark:prose-invert max-w-none">
              <h2>How to Use Movie Reporter</h2>

              <h3>Creating an Account</h3>
              <p>
                Click the "Login" button in the header and select "Sign up" to create your account with email and
                password.
              </p>

              <h3>Rating & Reviewing Movies</h3>
              <p>
                Visit the "Reviews & Ratings" page, select a movie, and click on it to open the rating modal. You can
                rate movies from 1 to 5 stars and optionally write a review.
              </p>

              <h3>Following Upcoming Movies</h3>
              <p>
                On the "Upcoming Releases" page, click "I'm Interested" on any movie to track its release. You'll see a
                countdown timer for all your interested movies in your profile.
              </p>

              <h3>Participating in Polls</h3>
              <p>
                Visit the "Polls" page to vote on active entertainment polls. Results are shown in real-time after you
                vote.
              </p>

              <h3>Award Voting</h3>
              <p>
                During award season, visit "Vote Enroll" to vote for your favorite nominees. You can change your vote
                within 24 hours of voting.
              </p>

              <h3>Engaging with Content</h3>
              <p>
                Like, comment, and share news articles and blog posts. React to other users' comments with emoji
                reactions.
              </p>

              <h2>Need More Help?</h2>
              <p>
                If you need additional assistance, please use the feedback form on our About page or contact us at
                support@moviereporter.com
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
