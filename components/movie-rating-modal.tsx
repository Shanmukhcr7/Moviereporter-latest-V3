"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Calendar, Edit, Trash } from "lucide-react"
import Image from "next/image"
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, increment, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "firebase/auth"

interface MovieRatingModalProps {
  movie: any
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export function MovieRatingModal({ movie, isOpen, onClose, user }: MovieRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviews, setReviews] = useState<any[]>([])
  const [userReview, setUserReview] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchReviews()
    }
  }, [isOpen, movie.id])

  const fetchReviews = async () => {
    try {
      const reviewsQuery = query(collection(db, "artifacts/default-app-id/reviews"), where("movieId", "==", movie.id))
      const snapshot = await getDocs(reviewsQuery)
      const reviewsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()
        let userName = data.userName || "Anonymous"

        // If userName is missing or default, try to fetch from User Profile
        if ((!data.userName || data.userName === "Anonymous") && data.userId) {
          try {
            const userDoc = await getDoc(doc(db, "artifacts/default-app-id/users", data.userId))
            if (userDoc.exists()) {
              userName = userDoc.data().username || userDoc.data().displayName || "Anonymous"
            }
          } catch (e) {
            // console.warn("Failed to fetch user for review", e)
          }
        }

        return {
          id: docSnap.id,
          ...data,
          userName: userName
        }
      })) as any[]

      setReviews(reviewsData)

      if (user) {
        const existingReview = reviewsData.find((r) => r.userId === user.uid)
        if (existingReview) {
          setUserReview(existingReview)
          setRating(existingReview.rating)
          // Handle both 'review' (new) and 'reviewText' (legacy)
          setReview(existingReview.review || existingReview.reviewText || "")
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching reviews:", error)
    }
  }

  const handleSubmitReview = async () => {
    if (!user || rating === 0) return

    setLoading(true)
    try {
      const now = new Date().toISOString()

      const reviewData = {
        movieId: movie.id,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        rating,
        review,
        createdAt: now,
        approved: true // Auto-approve
      }

      if (userReview) {
        // Update existing review
        const reviewRef = doc(db, "artifacts/default-app-id/reviews", userReview.id)

        await updateDoc(reviewRef, {
          rating,
          review,
          updatedAt: now,
          approved: true
        })

        // Also update private user copy (legacy text doesn't mention update but safer to keep in sync)
        const userReviewRef = doc(db, `artifacts/default-app-id/users/${user.uid}/userReviews/${userReview.id}`)
        // Legacy parity: update user private collection too
        // Note: userReview.id from our local state is likely the global review ID, as we fetch from global reviews in this component.
        // Legacy logic: 
        //  - global: id = auto-gen
        //  - user private: doc(..., globalReviewId)

        // We'll trust that userReview.id is the Review ID
        await setDoc(userReviewRef, { ...reviewData, reviewId: userReview.id, updatedAt: now }, { merge: true })

      } else {
        // Create new review
        const globalReviewRef = await addDoc(collection(db, "artifacts/default-app-id/reviews"), reviewData)

        // Add to user private collection (Parity)
        // Path: users/{uid}/userReviews/{reviewId}
        const userReviewsRef = doc(db, `artifacts/default-app-id/users/${user.uid}/userReviews`, globalReviewRef.id)
        await setDoc(userReviewsRef, {
          ...reviewData,
          reviewId: globalReviewRef.id
        })

        // Update movie review count
        await updateDoc(doc(db, "artifacts/default-app-id/movies", movie.id), {
          reviewCount: increment(1),
        })
      }

      // Recalculate average rating
      await recalculateMovieRating()

      setIsEditing(false)
      fetchReviews()
    } catch (error) {
      console.error("[v0] Error submitting review:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!userReview) return

    setLoading(true)
    try {
      await deleteDoc(doc(db, "artifacts/default-app-id/reviews", userReview.id))
      // Delete user private copy
      if (user) {
        await deleteDoc(doc(db, `artifacts/default-app-id/users/${user.uid}/userReviews`, userReview.id))
      }

      await updateDoc(doc(db, "artifacts/default-app-id/movies", movie.id), {
        reviewCount: increment(-1),
      })

      await recalculateMovieRating()

      setUserReview(null)
      setRating(0)
      setReview("")
      fetchReviews()
    } catch (error) {
      console.error("[v0] Error deleting review:", error)
    } finally {
      setLoading(false)
    }
  }

  const recalculateMovieRating = async () => {
    const reviewsQuery = query(collection(db, "artifacts/default-app-id/reviews"), where("movieId", "==", movie.id))
    const snapshot = await getDocs(reviewsQuery)

    const ratings = snapshot.docs.map((doc) => doc.data().rating)
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

    await updateDoc(doc(db, "artifacts/default-app-id/movies", movie.id), {
      avgRating,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="hidden md:block">{movie.title}</DialogTitle>
          <DialogDescription>Rate and review this movie</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Movie Info */}
          <div className="space-y-4">
            {/* Mobile: Row Layout, Desktop: Stacked */}
            <div className="flex md:block gap-4 md:gap-0 md:space-y-4">
              <div className="relative w-24 md:w-full aspect-[2/3] overflow-hidden rounded-lg flex-shrink-0">
                <Image src={movie.poster || movie.posterUrl || "/placeholder.svg"} alt={movie.title} fill className="object-cover" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="md:hidden font-semibold text-lg line-clamp-2">{movie.title}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span>
                      {(() => {
                        if (!movie.releaseDate) return "N/A"
                        try {
                          // Handle Firestore Timestamp
                          if (typeof movie.releaseDate.toDate === 'function') {
                            return movie.releaseDate.toDate().toLocaleDateString()
                          }
                          // Handle serialized Timestamp (seconds)
                          if (movie.releaseDate.seconds) {
                            return new Date(movie.releaseDate.seconds * 1000).toLocaleDateString()
                          }
                          // Handle Date object or valid date string
                          const d = new Date(movie.releaseDate)
                          return !isNaN(d.getTime()) ? d.toLocaleDateString() : "Invalid Date"
                        } catch (e) {
                          return "N/A"
                        }
                      })()}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-bold text-xl">{movie.avgRating?.toFixed(1) || "N/A"}</span>
                  <span className="text-sm text-muted-foreground">({movie.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>

            {/* Description Removed from Left Column */}
          </div>

          {/* Reviews Section */}
          <div className="md:col-span-2 space-y-6">
            {/* User Rating */}
            {user && (
              <div className="border border-border rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Your Rating</h3>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star)
                        setIsEditing(true)
                      }}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      disabled={userReview && !isEditing}
                      className="disabled:cursor-not-allowed"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${star <= (hoveredRating || rating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-muted-foreground"
                          }`}
                      />
                    </button>
                  ))}
                </div>

                {(isEditing || !userReview) && (
                  <>
                    <Textarea
                      placeholder="Write your review (optional)..."
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitReview} disabled={loading || rating === 0}>
                        {loading ? "Saving..." : userReview ? "Update Review" : "Submit Review"}
                      </Button>
                      {userReview && (
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {userReview && !isEditing && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeleteReview} disabled={loading}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <div className="border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">Please login to rate and review this movie</p>
              </div>
            )}

            {/* Movie Description (Moved to Main Column) */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Synopsis</h3>
              <p className={`text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap ${!isDescExpanded ? 'line-clamp-3' : ''}`}>
                {movie.description || "No description available."}
              </p>
              {movie.description?.length > 150 && (
                <Button variant="link" size="sm" onClick={() => setIsDescExpanded(!isDescExpanded)} className="p-0 h-auto text-primary font-medium">
                  {isDescExpanded ? "Read Less" : "Read More"}
                </Button>
              )}
            </div>

            {/* All Reviews */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">All Reviews</h3>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((reviewItem) => (
                  <div key={reviewItem.id} className="border border-border rounded-lg p-4 space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{reviewItem.userName}</span>
                      <div className="flex items-center gap-3">
                        {/* Actions for own review */}
                        {user && reviewItem.userId === user.uid && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setIsEditing(true)
                                // Scroll to top
                                document.querySelector('.radix-dialog-content')?.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              title="Edit Review"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={handleDeleteReview}
                              title="Delete Review"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-semibold">{reviewItem.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Support both 'review' and legacy 'reviewText' */}
                    {(reviewItem.review || reviewItem.reviewText) && (
                      <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">
                        {reviewItem.review || reviewItem.reviewText}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        if (!reviewItem.createdAt) return "Unknown Date"
                        try {
                          if (typeof reviewItem.createdAt.toDate === 'function') {
                            return reviewItem.createdAt.toDate().toLocaleDateString()
                          }
                          if (reviewItem.createdAt.seconds) {
                            return new Date(reviewItem.createdAt.seconds * 1000).toLocaleDateString()
                          }
                          const d = new Date(reviewItem.createdAt)
                          return !isNaN(d.getTime()) ? d.toLocaleDateString() : "Invalid Date"
                        } catch (e) {
                          return "Unknown Date"
                        }
                      })()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
