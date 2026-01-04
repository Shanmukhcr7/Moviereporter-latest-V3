"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Film, Users, Newspaper, PenTool, BarChart3, Trophy, Megaphone, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    movies: 0,
    celebrities: 0,
    news: 0,
    blogs: 0,
    polls: 0,
    awards: 0,
    users: 0,
    comments: 0,
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const moviesSnap = await getDocs(collection(db, "movies"))
        const celebsSnap = await getDocs(collection(db, "celebrities"))
        const newsSnap = await getDocs(collection(db, "news"))
        const blogsSnap = await getDocs(collection(db, "blogs"))
        const pollsSnap = await getDocs(collection(db, "polls"))
        const awardsSnap = await getDocs(collection(db, "awards"))
        const usersSnap = await getDocs(collection(db, "users"))
        const commentsSnap = await getDocs(collection(db, "comments"))

        setStats({
          movies: moviesSnap.size,
          celebrities: celebsSnap.size,
          news: newsSnap.size,
          blogs: blogsSnap.size,
          polls: pollsSnap.size,
          awards: awardsSnap.size,
          users: usersSnap.size,
          comments: commentsSnap.size,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    if (user?.role === "admin") {
      fetchStats()
    }
  }, [user])

  if (loading || !user || user.role !== "admin") {
    return null
  }

  const adminSections = [
    { title: "Movies Management", icon: Film, count: stats.movies, href: "/admin/movies", color: "bg-blue-500" },
    {
      title: "Celebrities Management",
      icon: Users,
      count: stats.celebrities,
      href: "/admin/celebrities",
      color: "bg-purple-500",
    },
    { title: "News Management", icon: Newspaper, count: stats.news, href: "/admin/news", color: "bg-green-500" },
    { title: "Blogs Management", icon: PenTool, count: stats.blogs, href: "/admin/blogs", color: "bg-orange-500" },
    { title: "Polls Management", icon: BarChart3, count: stats.polls, href: "/admin/polls", color: "bg-cyan-500" },
    { title: "Awards Management", icon: Trophy, count: stats.awards, href: "/admin/awards", color: "bg-yellow-500" },
    { title: "Promotions Management", icon: Megaphone, count: 0, href: "/admin/promotions", color: "bg-pink-500" },
    {
      title: "Comments Management",
      icon: MessageSquare,
      count: stats.comments,
      href: "/admin/comments",
      color: "bg-red-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all content and settings for Movie Reporter</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{section.title}</p>
                    <p className="text-2xl font-bold">{section.count}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/movies/new"
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center font-medium"
            >
              Add New Movie
            </Link>
            <Link
              href="/admin/news/new"
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center font-medium"
            >
              Add New News
            </Link>
            <Link
              href="/admin/blogs/new"
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center font-medium"
            >
              Add New Blog
            </Link>
            <Link
              href="/admin/polls/new"
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center font-medium"
            >
              Add New Poll
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
