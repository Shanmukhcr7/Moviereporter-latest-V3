"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, Search, User, Film, Sun, Moon, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/components/theme-provider"

import { SearchOverlay } from "@/components/search-overlay"
import { MobileNav } from "@/components/mobile-nav"
import { LanguageSelector } from "@/components/language-selector"
import { AwardWinnersDropdown } from "@/components/award-winners-dropdown"

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, userData, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Film className="h-6 w-6" />
              <span>Movie Lovers</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>

              <Link href="/movies" className="text-sm font-medium hover:text-primary transition-colors">
                Movie Review/Rating
              </Link>

              {/* Movies World Dropdown */}
              <div className="relative group">
                <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  Movies World
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-popover border border-border rounded-lg shadow-lg">
                  <Link href="/celebrities" className="block px-4 py-2 text-sm hover:bg-accent rounded-t-lg">
                    Celebrity Profiles
                  </Link>
                  <Link href="/movies-info" className="block px-4 py-2 text-sm hover:bg-accent">
                    Movies Info
                  </Link>
                  <Link href="/top-boxoffice" className="block px-4 py-2 text-sm hover:bg-accent">
                    Top Box Office
                  </Link>
                  <Link href="/upcoming-releases" className="block px-4 py-2 text-sm hover:bg-accent">
                    Upcoming Releases
                  </Link>
                  <Link href="/trailers" className="block px-4 py-2 text-sm hover:bg-accent">
                    Trailers
                  </Link>
                  <Link href="/trailers?tab=teasers" className="block px-4 py-2 text-sm hover:bg-accent">
                    Teasers
                  </Link>
                  <Link href="/celebrity-social" className="block px-4 py-2 text-sm hover:bg-accent">
                    Celebrity Social Media
                  </Link>
                  <Link href="/ott-releases" className="block px-4 py-2 text-sm hover:bg-accent rounded-b-lg">
                    OTT Releases
                  </Link>
                </div>
              </div>

              <Link href="/news" className="text-sm font-medium hover:text-primary transition-colors">
                Latest News
              </Link>

              <Link href="/polls" className="text-sm font-medium hover:text-primary transition-colors">
                Polling
              </Link>

              <Link href="/weekly-magazine" className="text-sm font-medium hover:text-primary transition-colors hidden xl:block">
                Weekly Magazine
              </Link>

              <Link href="/blogs" className="text-sm font-medium hover:text-primary transition-colors hidden xl:block">
                Blogs
              </Link>

              {/* Vote Enroll Dropdown */}
              <div className="relative group">
                <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  Vote Enroll
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-popover border border-border rounded-lg shadow-lg">
                  {["Tollywood", "Bollywood", "Kollywood", "Sandalwood", "Hollywood", "Mollywood", "Pan India"].map((industry) => (
                    <Link
                      key={industry}
                      href={`/vote-enroll?industry=${industry.toLowerCase().replace(" ", "-")}`}
                      className="block px-4 py-2 text-sm hover:bg-accent first:rounded-t-lg last:rounded-b-lg"
                    >
                      {industry}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Award Winners Dropdown */}
              <div className="relative group">
                <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  Award Winners
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                  <AwardWinnersDropdown />
                </div>
              </div>

              {/* About Dropdown */}
              <div className="relative group">
                <button className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  About Us
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-popover border border-border rounded-lg shadow-lg">
                  <Link href="/about" className="block px-4 py-2 text-sm hover:bg-accent rounded-t-lg">
                    About Us
                  </Link>
                  <Link href="/help" className="block px-4 py-2 text-sm hover:bg-accent">
                    Help For Us
                  </Link>
                  <Link href="/promotion" className="block px-4 py-2 text-sm hover:bg-accent">
                    Contact for Promotion
                  </Link>
                  <Link href="/copyright" className="block px-4 py-2 text-sm hover:bg-accent rounded-b-lg">
                    Copyright Policy
                  </Link>
                </div>
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>

              {/* Admin Dashboard */}
              {userData?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="icon" title="Admin Dashboard">
                    <Shield className="h-5 w-5" />
                    <span className="sr-only">Admin Dashboard</span>
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hidden lg:flex"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              <LanguageSelector />

              {user ? (
                <>
                  <Link href="/profile" className="hidden lg:flex">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => signOut()} className="hidden lg:flex">
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button size="sm">Login</Button>
                </Link>
              )}

              {/* Mobile Menu Toggle with Fixed Spacing */}
              <div className="pl-2 lg:hidden">
                <MobileNav />
              </div>
            </div>
          </div>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
