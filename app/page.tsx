"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Header } from "@/components/header"
import { NewsTicker } from "@/components/news-ticker"
import { HeroBanner } from "@/components/hero-banner"
import { MovieCard } from "@/components/movie-card"
import { ArticleCard } from "@/components/article-card"
import { CelebrityCard } from "@/components/celebrity-card"
import { HomePolls } from "@/components/home-polls"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Film, TrendingUp, Calendar, Star, Users, Newspaper, BookOpen } from "lucide-react"
import { SectionCarousel } from "@/components/ui/section-carousel"
import { FadeIn } from "@/components/animations/fade-in"

export default function HomePage() {
  const [latestMovies, setLatestMovies] = useState<any[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<any[]>([])
  const [weeklyMagazine, setWeeklyMagazine] = useState<any[]>([])
  const [celebrities, setCelebrities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHomeData() {
      try {
        // Fetch latest released movies
        // Fetch latest released movies (fetch more and filter/sort in memory to handle missing fields)
        const moviesQuery = query(
          collection(db, "artifacts/default-app-id/movies"),
          limit(50),
        )
        const moviesSnapshot = await getDocs(moviesQuery)
        const allMovies = moviesSnapshot.docs.map((doc) => {
          const d = doc.data()
          return {
            id: doc.id,
            ...d,
            // Normalize fields
            poster: d.poster || d.posterUrl || d.image || d.bannerImageUrl || "",
            releaseDate: d.releaseDate?.toMillis ? new Date(d.releaseDate.toMillis()).toISOString() : d.releaseDate,
          }
        })

        // Filter for released movies and sort by date descending
        const now = new Date()
        const releasedMovies = allMovies
          .filter((m: any) => {
            // Show all, just handle sort
            return true
          })
          .sort((a: any, b: any) => {
            const getMillis = (d: any) => d?.toMillis ? d.toMillis() : new Date(d || 0).getTime()
            const dateA = getMillis(a.releaseDate)
            const dateB = getMillis(b.releaseDate)
            return dateB - dateA
          })
          .slice(0, 8)

        setLatestMovies(releasedMovies)

        // Fetch featured articles (news + blogs)
        // Featured articles - client side sort
        const newsQuery = query(collection(db, "artifacts/default-app-id/news"), limit(20))
        const blogsQuery = query(collection(db, "artifacts/default-app-id/blogs"), limit(20))

        const [newsSnapshot, blogsSnapshot] = await Promise.all([getDocs(newsQuery), getDocs(blogsQuery)])

        const allNews = newsSnapshot.docs.map((doc) => {
          const d = doc.data()
          return {
            id: doc.id,
            type: "news" as const,
            ...d,
            image: d.image || d.imageUrl || d.bannerImage || d.bannerImageUrl || "",
            publishedAt: d.publishedAt?.toMillis ? new Date(d.publishedAt.toMillis()).toISOString() : d.publishedAt,
          }
        })
        const allBlogs = blogsSnapshot.docs.map((doc) => {
          const d = doc.data()
          return {
            id: doc.id,
            type: "blog" as const,
            ...d,
            image: d.image || d.imageUrl || d.bannerImage || d.bannerImageUrl || "",
            publishedAt: d.publishedAt?.toMillis ? new Date(d.publishedAt.toMillis()).toISOString() : d.publishedAt,
          }
        })

        const combinedArticles = [...allNews, ...allBlogs]
          .sort((a: any, b: any) => {
            const getMillis = (d: any) => d?.toMillis ? d.toMillis() : new Date(d || 0).getTime()
            const dateA = getMillis(a.publishedAt)
            const dateB = getMillis(b.publishedAt)
            return dateB - dateA
          })
          .slice(0, 4)

        setFeaturedArticles(combinedArticles)

        // Fetch upcoming releases
        // Upcoming releases - client side filter
        // Reuse allMovies from above if possible, but for clarity fetching again or reusing query results would contain everything if limit was high enough.
        // Let's reuse 'allMovies' from the first fetch if it includes enough data, but we limited to 50.
        // It's safer to just filter 'allMovies' for upcoming:

        const upcoming = allMovies
          .filter((m: any) => {
            // Show all
            return true
          })
          .sort((a: any, b: any) => {
            const getMillis = (d: any) => d?.toMillis ? d.toMillis() : new Date(d || 0).getTime()
            const dateA = getMillis(a.releaseDate)
            const dateB = getMillis(b.releaseDate)
            return dateA - dateB
          })
          .slice(0, 8)

        setUpcomingMovies(upcoming)

        // Fetch weekly magazine
        const magazineQuery = query(
          collection(db, "artifacts/default-app-id/news"),
          where("isWeeklyMagazine", "==", true),
          limit(10), // Increased limit, sort client side if needed
        )
        const magazineSnapshot = await getDocs(magazineQuery)
        setWeeklyMagazine(
          magazineSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: "news",
            ...doc.data(),
          })),
        )

        // Fetch celebrities
        const celebsQuery = query(collection(db, "artifacts/default-app-id/celebrities"), limit(8))
        const celebsSnapshot = await getDocs(celebsQuery)
        setCelebrities(
          celebsSnapshot.docs.map((doc) => {
            const d = doc.data()
            return {
              id: doc.id,
              ...d,
              image: d.image || d.imageUrl || d.profileImage || "",
            }
          }),
        )

        setLoading(false)
      } catch (error) {
        console.error("[v0] Error fetching home data:", error)
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  return (
    <div className="min-h-screen">
      <Header />
      <NewsTicker />
      <HeroBanner />

      {/* Secondary Navigation */}
      <div className="border-y border-border bg-card/50 backdrop-blur sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-8 py-4 overflow-x-auto">
            <Link
              href="/movies"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary whitespace-nowrap"
            >
              <Film className="h-4 w-4" />
              Reviews
            </Link>
            <Link
              href="/top-boxoffice"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary whitespace-nowrap"
            >
              <TrendingUp className="h-4 w-4" />
              Top Box Office
            </Link>
            <Link
              href="/upcoming-releases"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary whitespace-nowrap"
            >
              <Calendar className="h-4 w-4" />
              Upcoming
            </Link>
            <Link
              href="/celebrities"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary whitespace-nowrap"
            >
              <Users className="h-4 w-4" />
              Celebrities
            </Link>
            <Link
              href="/news"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary whitespace-nowrap"
            >
              <Newspaper className="h-4 w-4" />
              News
            </Link>
            <Link
              href="/polls"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary whitespace-nowrap"
            >
              <Star className="h-4 w-4" />
              Polls
            </Link>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-4">
        {/* Latest Movies */}
        <section>
          <FadeIn>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Film className="w-8 h-8 text-primary" />
                  Latest Movies
                </h2>
                <p className="text-muted-foreground">Recently released films you don't want to miss</p>
              </div>
              <Link href="/movies-info">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <SectionCarousel>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="min-w-[160px] md:min-w-[200px] aspect-[2/3] bg-muted animate-pulse rounded-lg snap-start" />
                ))
                : latestMovies.map((movie) => (
                  <div key={movie.id} className="min-w-[160px] md:min-w-[200px] snap-start">
                    <MovieCard {...movie} />
                  </div>
                ))}
            </SectionCarousel>
          </FadeIn>
        </section>

        <Separator />

        {/* Featured Articles */}
        <section>
          <FadeIn delay={0.1}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Newspaper className="w-8 h-8 text-primary" />
                  Featured Articles
                </h2>
                <p className="text-muted-foreground">Latest news and insights from the entertainment world</p>
              </div>
              <Link href="/news">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <SectionCarousel>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[280px] md:min-w-[350px] aspect-video bg-muted animate-pulse rounded-lg snap-start" />
                ))
                : featuredArticles.map((article) => (
                  <div key={article.id} className="min-w-[280px] md:min-w-[350px] snap-start">
                    <ArticleCard {...article} />
                  </div>
                ))}
            </SectionCarousel>
          </FadeIn>
        </section>

        <Separator />

        {/* Upcoming Releases */}
        <section>
          <FadeIn delay={0.2}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-primary" />
                  Upcoming Releases
                </h2>
                <p className="text-muted-foreground">Mark your calendar for these exciting releases</p>
              </div>
              <Link href="/upcoming-releases">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <SectionCarousel>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="min-w-[160px] md:min-w-[200px] aspect-[2/3] bg-muted animate-pulse rounded-lg snap-start" />
                ))
                : upcomingMovies.map((movie) => (
                  <div key={movie.id} className="min-w-[160px] md:min-w-[200px] snap-start">
                    <MovieCard {...movie} enableInterest={true} />
                  </div>
                ))}
            </SectionCarousel>
          </FadeIn>
        </section>

        <Separator />

        {/* Polls */}
        <FadeIn delay={0.3}>
          <HomePolls />
        </FadeIn>

        <Separator />

        {/* Weekly Magazine */}
        <section className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6">
          <FadeIn delay={0.4}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-primary" />
                  Weekly Magazine
                </h2>
                <p className="text-muted-foreground">This week's top stories and exclusive content</p>
              </div>
              <Link href="/weekly-magazine">
                <Button>View Magazine</Button>
              </Link>
            </div>
            <SectionCarousel className="scrollbar-hide">
              {loading
                ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="min-w-[280px] md:min-w-[400px] aspect-video bg-muted animate-pulse rounded-lg snap-start" />
                ))
                : weeklyMagazine.map((article) => (
                  <div key={article.id} className="min-w-[280px] md:min-w-[400px] snap-start">
                    <ArticleCard {...article} />
                  </div>
                ))}
            </SectionCarousel>
          </FadeIn>
        </section>

        <Separator />

        {/* Celebrity Profiles */}
        <section>
          <FadeIn delay={0.5}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  Celebrity Profiles
                </h2>
                <p className="text-muted-foreground">Get to know your favorite stars</p>
              </div>
              <Link href="/celebrities">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <SectionCarousel>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="min-w-[140px] md:min-w-[180px] aspect-[3/4] bg-muted animate-pulse rounded-lg snap-start" />
                ))
                : celebrities.map((celebrity) => (
                  <div key={celebrity.id} className="min-w-[140px] md:min-w-[180px] snap-start">
                    <CelebrityCard {...celebrity} />
                  </div>
                ))}
            </SectionCarousel>
          </FadeIn>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 Movie Reporter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
