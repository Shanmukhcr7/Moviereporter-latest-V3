"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Film, Users, Newspaper, BarChart3, Trophy, MessageCircle, AlertCircle } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DashboardPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    movies: 0,
    celebrities: 0,
    news: 0,
    blogs: 0,
    polls: 0,
    users: 0,
    reviews: 0,
    comments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || userData?.role !== "admin")) {
      router.push("/")
      return
    }

    if (user && userData?.role === "admin") {
      fetchStats()
    }
  }, [user, userData, authLoading])

  const fetchStats = async () => {
    try {
      const collections = [
        { name: "movies", path: "artifacts/default-app-id/movies" },
        { name: "celebrities", path: "artifacts/default-app-id/celebrities" },
        { name: "news", path: "artifacts/default-app-id/news" },
        { name: "blogs", path: "artifacts/default-app-id/blogs" },
        { name: "polls", path: "artifacts/default-app-id/polls" },
        { name: "users", path: "artifacts/default-app-id/users" },
        { name: "reviews", path: "artifacts/default-app-id/reviews" },
        { name: "comments", path: "artifacts/default-app-id/comments" },
      ]

      const statsData: any = {}

      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col.path))
        statsData[col.name] = snapshot.size
      }

      setStats(statsData)
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || userData?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Movie Lovers platform</p>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.movies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Celebrities</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.celebrities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Articles</CardTitle>
              <Newspaper className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.news + stats.blogs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.news} News · {stats.blogs} Blogs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.polls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comments}</div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Role</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-6 bg-card">
                  <h3 className="font-semibold mb-4 text-lg">Quick Stats</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Content</p>
                      <p className="text-2xl font-bold">
                        {stats.movies + stats.celebrities + stats.news + stats.blogs}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Engagement</p>
                      <p className="text-2xl font-bold">{stats.reviews + stats.comments}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Features</p>
                      <p className="text-2xl font-bold">{stats.polls}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-500/50 bg-blue-500/5 p-6">
                  <h3 className="font-semibold mb-2">Admin Access</h3>
                  <p className="text-sm text-muted-foreground">
                    You have full administrative access to manage all aspects of the Movie Lovers platform. Use the
                    tabs above to manage content, users, and moderation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold mb-2">Movies Management</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add, edit, and manage movies in the database. Total movies: {stats.movies}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use Firebase Console to manage movies, celebrities, news, and blogs content.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold mb-2">Celebrity Profiles</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage celebrity profiles and their information. Total celebrities: {stats.celebrities}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use Firebase Console to add or edit celebrity profiles.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold mb-2">News & Blogs</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Publish and manage news articles and blog posts. Total articles: {stats.news + stats.blogs}
                    </p>
                    <p className="text-xs text-muted-foreground">Use Firebase Console to publish new content.</p>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold mb-2">Polls & Voting</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create and manage polls and award voting categories. Active polls: {stats.polls}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use Firebase Console to create polls and categories.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border p-6">
                  <h3 className="font-semibold mb-2">Registered Users</h3>
                  <p className="text-3xl font-bold mb-4">{stats.users}</p>
                  <p className="text-sm text-muted-foreground">
                    View and manage registered users. You can promote users to admin, block, or delete accounts through
                    the Firebase Console.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold mb-2">Reviews & Ratings</h3>
                    <p className="text-sm text-muted-foreground mb-2">Total reviews: {stats.reviews}</p>
                    <p className="text-xs text-muted-foreground">
                      Monitor and moderate user reviews. Remove inappropriate content when necessary.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h3 className="font-semibold mb-2">Comments</h3>
                    <p className="text-sm text-muted-foreground mb-2">Total comments: {stats.comments}</p>
                    <p className="text-xs text-muted-foreground">
                      Review user comments on news and blog posts. Delete inappropriate comments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
