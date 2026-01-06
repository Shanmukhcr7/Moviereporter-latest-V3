"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { UserActivityTabs } from "@/components/profile/user-activity-tabs"
import { Button } from "@/components/ui/button"
import { PushNotificationsToggle } from "@/components/push-notifications-toggle"

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
      <main className="flex-1 container mx-auto pt-6 pb-32 px-4 md:py-10 md:px-6 max-w-6xl space-y-6 md:space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold px-1">My Profile</h1>

        <ProfileHeader />

        <UserActivityTabs />


        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Settings</h3>
          <PushNotificationsToggle />
        </div>

        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            className="w-full md:w-auto md:min-w-[200px]"
            onClick={() => useAuth().signOut()}
          >
            Log Out
          </Button>
        </div>
      </main>
    </div>
  )
}
