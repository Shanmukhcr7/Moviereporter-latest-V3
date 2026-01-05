"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getFromCache, saveToCache } from "@/lib/cache-utils"
import { Header } from "@/components/header"
import { NewsTicker } from "@/components/news-ticker"
import { NewsStories } from "@/components/news-stories"
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
  /* State for displayed items */
  const [latestMovies, setLatestMovies] = useState<any[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<any[]>([])
  const [weeklyMagazine, setWeeklyMagazine] = useState<any[]>([])
  const [celebrities, setCelebrities] = useState<any[]>([])

  /* State for remaining items (pagination) */
  const [remainingLatestMovies, setRemainingLatestMovies] = useState<any[]>([])
  const [remainingArticles, setRemainingArticles] = useState<any[]>([])
  const [remainingUpcomingMovies, setRemainingUpcomingMovies] = useState<any[]>([])
  const [remainingMagazine, setRemainingMagazine] = useState<any[]>([])
  const [remainingCelebrities, setRemainingCelebrities] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const cacheKey = "home_data_cache"
        const cached = getFromCache<any>(cacheKey)

        if (cached) {
          setLatestMovies(cached.latestMovies)
          setRemainingLatestMovies(cached.remainingLatestMovies)
          setFeaturedArticles(cached.featuredArticles)
          setRemainingArticles(cached.remainingArticles)
          setUpcomingMovies(cached.upcomingMovies)
          setRemainingUpcomingMovies(cached.remainingUpcomingMovies)
          setWeeklyMagazine(cached.weeklyMagazine)
          setRemainingMagazine(cached.remainingMagazine)
          setCelebrities(cached.celebrities)
          setRemainingCelebrities(cached.remainingCelebrities)
          setLoading(false)
          return
        }

        // Helper to prepare section data for cache and state
        const createSectionData = (current: any[], remaining: any[], type: string, fallbackTitle: string, fallbackLink: string) => {
          const itemsWithCard = [...current]
          itemsWithCard.push({
            id: "load-more-card-" + type + Date.now(),
            type: type,
            isLoadMore: true,
            hasMoreContent: remaining.length > 0,
            title: remaining.length > 0 ? "Load More" : fallbackTitle,
            link: fallbackLink,
            image: "",
            author: "",
            publishedAt: "",
            excerpt: remaining.length > 0 ? "Load more items" : "View full list"
          })
          return { displayed: itemsWithCard, remaining }
        }

        // Fetch latest released movies
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
            poster: d.poster || d.posterUrl || d.image || d.bannerImageUrl || "",
            releaseDate: d.releaseDate?.toMillis ? new Date(d.releaseDate.toMillis()).toISOString() : d.releaseDate,
          }
        })

        const releasedMovies = allMovies
          .filter((m: any) => {
            const getMillis = (d: any) => d?.toMillis ? d.toMillis() : new Date(d || 0).getTime()
            const rDate = getMillis(m.releaseDate)
            return rDate <= Date.now()
          })
          .sort((a: any, b: any) => {
            const getMillis = (d: any) => d?.toMillis ? d.toMillis() : new Date(d || 0).getTime()
            const dateA = getMillis(a.releaseDate)
            const dateB = getMillis(b.releaseDate)
            return dateB - dateA
          })

        // Split Released Movies
        const initialLatest = releasedMovies.slice(0, 6)
        const remainingLatest = releasedMovies.slice(6)

        const latestData = createSectionData(initialLatest, remainingLatest, "movie", "View All Movies", "/movies-info")
        setLatestMovies(latestData.displayed)
        setRemainingLatestMovies(latestData.remaining)

        // Featured Articles Logic
        const newsQuery = query(collection(db, "artifacts/default-app-id/news"), limit(20))
        const blogsQuery = query(collection(db, "artifacts/default-app-id/blogs"), limit(20))

        const [newsSnapshot, blogsSnapshot] = await Promise.all([getDocs(newsQuery), getDocs(blogsQuery)])

        const processArticles = (docs: any[], type: "news" | "blog") => {
          return docs.map(doc => {
            const d = doc.data()
            const dateVal = d.publishedAt
            let millis = 0
            if (dateVal?.toMillis) millis = dateVal.toMillis()
            else if (dateVal?.seconds) millis = dateVal.seconds * 1000
            else millis = new Date(dateVal || 0).getTime()

            return {
              id: doc.id,
              type,
              ...d,
              image: d.image || d.imageUrl || d.bannerImage || d.bannerImageUrl || "",
              publishedAt: millis,
            }
          })
            .sort((a, b) => b.publishedAt - a.publishedAt)
        }

        const sortedNews = processArticles(newsSnapshot.docs, "news")
        const sortedBlogs = processArticles(blogsSnapshot.docs, "blog")

        // Initial Set: 2 News, 2 Blogs
        const initialArticles = [
          ...sortedNews.slice(0, 2),
          ...sortedBlogs.slice(0, 2)
        ]

        const leftoverNews = sortedNews.slice(2)
        const leftoverBlogs = sortedBlogs.slice(2)
        const pool = [...leftoverNews, ...leftoverBlogs].sort((a, b) => b.publishedAt - a.publishedAt)

        const featuredData = createSectionData(initialArticles, pool, "news", "View All Articles", "/news")
        setFeaturedArticles(featuredData.displayed)
        setRemainingArticles(featuredData.remaining)

        // Upcoming 
        const upcoming = allMovies
          .filter((m: any) => {
            const getMillis = (d: any) => d?.toMillis ? d.toMillis() : new Date(d || 0).getTime()
            const rDate = getMillis(m.releaseDate)
            return rDate > Date.now()
          })
          .sort((a: any, b: any) => {
            const getMillis = (d: any) => d?.toMillis ? d.toMillis() : new Date(d || 0).getTime()
            const dateA = getMillis(a.releaseDate)
            const dateB = getMillis(b.releaseDate)
            return dateA - dateB
          })

        // Split Upcoming
        const initialUpcoming = upcoming.slice(0, 6)
        const remainingUpcoming = upcoming.slice(6)

        const upcomingData = createSectionData(initialUpcoming, remainingUpcoming, "movie", "View All Upcoming", "/upcoming-releases")
        setUpcomingMovies(upcomingData.displayed)
        setRemainingUpcomingMovies(upcomingData.remaining)

        // Magazine
        const magazineQuery = query(
          collection(db, "artifacts/default-app-id/news"),
          where("isWeeklyMagazine", "==", true),
          limit(20),
        )
        const magazineSnapshot = await getDocs(magazineQuery)
        const allMagazine = magazineSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: "news",
          ...doc.data(),
        }))
        const initialMagazine = allMagazine.slice(0, 6)
        const remainingMag = allMagazine.slice(6)

        const magazineData = createSectionData(initialMagazine, remainingMag, "news", "View Magazine", "/weekly-magazine")
        setWeeklyMagazine(magazineData.displayed)
        setRemainingMagazine(magazineData.remaining)

        // Celebs
        const celebsQuery = query(collection(db, "artifacts/default-app-id/celebrities"), limit(24))
        const celebsSnapshot = await getDocs(celebsQuery)
        const allCelebs = celebsSnapshot.docs.map((doc) => {
          const d = doc.data()
          return {
            id: doc.id,
            ...d,
            image: d.image || d.imageUrl || d.profileImage || "",
          }
        })
        const initialCelebs = allCelebs.slice(0, 6)
        const remainingCel = allCelebs.slice(6)

        const celebsData = createSectionData(initialCelebs, remainingCel, "celebrity", "View All Celebs", "/celebrities")
        setCelebrities(celebsData.displayed)
        setRemainingCelebrities(celebsData.remaining)

        // SAVE TO CACHE
        saveToCache(cacheKey, {
          latestMovies: latestData.displayed,
          remainingLatestMovies: latestData.remaining,
          featuredArticles: featuredData.displayed,
          remainingArticles: featuredData.remaining,
          upcomingMovies: upcomingData.displayed,
          remainingUpcomingMovies: upcomingData.remaining,
          weeklyMagazine: magazineData.displayed,
          remainingMagazine: magazineData.remaining,
          celebrities: celebsData.displayed,
          remainingCelebrities: celebsData.remaining
        })

        setLoading(false)
      } catch (error) {
        console.error("[v0] Error fetching home data:", error)
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  /* Scroll logic */
  const scrollToIdRef = useRef<string | null>(null)

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
      scrollToIdRef.current = null
    }
  }, [])

  // Helper to update state with Load More card
  const updateSectionState = (
    current: any[],
    remaining: any[],
    type: string,
    setState: (val: any[]) => void,
    setRemaining: (val: any[]) => void,
    fallbackTitle: string,
    fallbackLink: string
  ) => {
    const itemsWithCard = [...current]
    itemsWithCard.push({
      id: "load-more-card-" + type + Date.now(), // Unique ID
      type: type, // dummy type
      isLoadMore: true,
      hasMoreContent: remaining.length > 0,
      title: remaining.length > 0 ? "Load More" : fallbackTitle,
      link: fallbackLink, // pass link for fallback
      image: "",
      author: "",
      publishedAt: "",
      excerpt: remaining.length > 0 ? "Load more items" : "View full list"
    })

    setState(itemsWithCard)
    setRemaining(remaining)
  }

  // Generic Handler
  const handleLoadMoreGeneric = (
    displayed: any[],
    remaining: any[],
    setState: (val: any[]) => void,
    setRemaining: (val: any[]) => void,
    type: string,
    fallbackTitle: string,
    fallbackLink: string
  ) => {
    const batchSize = 4
    const nextBatch = remaining.slice(0, batchSize)
    const newRemaining = remaining.slice(batchSize)

    if (nextBatch.length > 0) {
      scrollToIdRef.current = nextBatch[0].id
    }

    const currentContent = displayed.filter(a => !a.isLoadMore)
    const newContent = [...currentContent, ...nextBatch]

    updateSectionState(newContent, newRemaining, type, setState, setRemaining, fallbackTitle, fallbackLink)
  }

  // Specific Handlers
  const handleLoadMoreFeatured = () => handleLoadMoreGeneric(featuredArticles, remainingArticles, setFeaturedArticles, setRemainingArticles, "news", "View All Articles", "/news")
  const handleLoadMoreLatest = () => handleLoadMoreGeneric(latestMovies, remainingLatestMovies, setLatestMovies, setRemainingLatestMovies, "movie", "View All Movies", "/movies-info")
  const handleLoadMoreUpcoming = () => handleLoadMoreGeneric(upcomingMovies, remainingUpcomingMovies, setUpcomingMovies, setRemainingUpcomingMovies, "movie", "View All Upcoming", "/upcoming-releases")
  const handleLoadMoreMagazine = () => handleLoadMoreGeneric(weeklyMagazine, remainingMagazine, setWeeklyMagazine, setRemainingMagazine, "news", "View Magazine", "/weekly-magazine")
  const handleLoadMoreCelebs = () => handleLoadMoreGeneric(celebrities, remainingCelebrities, setCelebrities, setRemainingCelebrities, "celebrity", "View All Celebs", "/celebrities")

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
        {/* Stories */}
        <NewsStories />

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
                  <div
                    key={movie.id}
                    className="min-w-[160px] md:min-w-[200px] snap-start"
                    ref={movie.id === scrollToIdRef.current ? scrollRef : null}
                  >
                    {movie.isLoadMore ? (
                      <LoadMoreCard item={movie} onClick={handleLoadMoreLatest} />
                    ) : (
                      <MovieCard {...movie} />
                    )}
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
                : featuredArticles.map((article: any) => (
                  <div
                    key={article.id}
                    className="min-w-[280px] md:min-w-[350px] snap-start"
                    ref={article.id === scrollToIdRef.current ? scrollRef : null}
                  >
                    {article.isLoadMore ? (
                      <LoadMoreCard item={article} onClick={handleLoadMoreFeatured} />
                    ) : (
                      <ArticleCard {...article} />
                    )}
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
                  <div
                    key={movie.id}
                    className="min-w-[160px] md:min-w-[200px] snap-start"
                    ref={movie.id === scrollToIdRef.current ? scrollRef : null}
                  >
                    {movie.isLoadMore ? (
                      <LoadMoreCard item={movie} onClick={handleLoadMoreUpcoming} icon={Calendar} />
                    ) : (
                      <MovieCard {...movie} enableInterest={true} />
                    )}
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
                  <div
                    key={article.id}
                    className="min-w-[280px] md:min-w-[400px] snap-start"
                    ref={article.id === scrollToIdRef.current ? scrollRef : null}
                  >
                    {article.isLoadMore ? (
                      <LoadMoreCard item={article} onClick={handleLoadMoreMagazine} icon={BookOpen} />
                    ) : (
                      <ArticleCard {...article} />
                    )}
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
                  <div
                    key={celebrity.id}
                    className="min-w-[140px] md:min-w-[180px] snap-start"
                    ref={celebrity.id === scrollToIdRef.current ? scrollRef : null}
                  >
                    {celebrity.isLoadMore ? (
                      <LoadMoreCard item={celebrity} onClick={handleLoadMoreCelebs} icon={Users} />
                    ) : (
                      <CelebrityCard {...celebrity} />
                    )}
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

function LoadMoreCard({ item, onClick, icon: Icon = Newspaper }: { item: any; onClick: () => void; icon?: any }) {
  if (item.hasMoreContent) {
    return (
      <div onClick={onClick} className="h-full bg-card/50 backdrop-blur border border-border/50 rounded-xl flex flex-col items-center justify-center p-8 text-center group hover:bg-muted/50 transition-colors cursor-pointer select-none">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
        <p className="text-sm text-muted-foreground">{item.excerpt}</p>
      </div>
    )
  }
  return (
    <Link href={item.link || "/"} className="block h-full">
      <div className="h-full bg-card/50 backdrop-blur border border-border/50 rounded-xl flex flex-col items-center justify-center p-8 text-center group hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
        <p className="text-sm text-muted-foreground">{item.excerpt}</p>
      </div>
    </Link>
  )
}
