"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { UserActivityTabs } from "@/components/profile/user-activity-tabs"

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4 md:py-10 md:px-6 max-w-6xl space-y-6 md:space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold px-1">My Profile</h1>

        <ProfileHeader />

        <UserActivityTabs />
      </main>
    </div>
  )
}
