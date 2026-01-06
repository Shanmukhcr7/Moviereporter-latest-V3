"use client"

import { Film, Menu, Search, User, X, Home, Globe, Star, Newspaper, BookOpen, BarChart2, CheckSquare, Trophy, Book, Info, HelpCircle, Megaphone, Copyright, Shield } from "lucide-react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/lib/auth-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AwardWinnersDropdown } from "@/components/award-winners-dropdown"
import { UserBadges } from "@/components/user-badges"
import { PushNotificationsToggle } from "@/components/push-notifications-toggle"

export function MobileNav() {
    const { theme, toggleTheme } = useTheme()
    const { user, userData, signOut } = useAuth()

    const iconClass = "h-4 w-4 mr-3"

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col h-full bg-background border-r">
                <SheetHeader className="p-4 border-b text-left shrink-0">
                    <SheetTitle className="flex items-center gap-2">
                        <Film className="h-6 w-6" />
                        <span>Movie Lovers</span>
                    </SheetTitle>
                </SheetHeader>

                {/* Menu Items - Scrollable */}
                <ScrollArea className="flex-1 w-full">
                    <div className="flex flex-col py-0">
                        <Link
                            href="/"
                            className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center"
                        >
                            <Home className={iconClass} />
                            Home
                        </Link>

                        {userData?.role === "admin" && (
                            <Link
                                href="/admin"
                                className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center text-primary"
                            >
                                <Shield className={iconClass} />
                                Admin Dashboard
                            </Link>
                        )}

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="movies-world" className="border-b-0">
                                <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline hover:bg-accent hover:text-accent-foreground">
                                    <div className="flex items-center">
                                        <Globe className={iconClass} />
                                        Movies World
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-muted/30">
                                    <div className="flex flex-col">
                                        <Link href="/celebrities" className="px-8 py-2 text-sm hover:text-primary transition-colors">
                                            Celebrity Profiles
                                        </Link>
                                        <Link href="/movies-info" className="px-8 py-2 text-sm hover:text-primary transition-colors">
                                            Movies Info
                                        </Link>
                                        <Link href="/top-boxoffice" className="px-8 py-2 text-sm hover:text-primary transition-colors">
                                            Top Box Office
                                        </Link>
                                        <Link href="/upcoming-releases" className="px-8 py-2 text-sm hover:text-primary transition-colors">
                                            Upcoming Releases
                                        </Link>
                                        <Link href="/ott-releases" className="px-8 py-2 text-sm hover:text-primary transition-colors">
                                            OTT Releases
                                        </Link>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <Link href="/movies" className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                            <Star className={iconClass} />
                            Reviews & Ratings
                        </Link>
                        <Link href="/news" className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                            <Newspaper className={iconClass} />
                            News
                        </Link>
                        <Link href="/blogs" className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                            <BookOpen className={iconClass} />
                            Blogs
                        </Link>
                        <Link href="/polls" className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                            <BarChart2 className={iconClass} />
                            Polls
                        </Link>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="vote-enroll" className="border-b-0">
                                <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline hover:bg-accent hover:text-accent-foreground">
                                    <div className="flex items-center">
                                        <CheckSquare className={iconClass} />
                                        Vote Enroll
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-muted/30">
                                    <div className="flex flex-col">
                                        {["Tollywood", "Bollywood", "Kollywood", "Sandalwood", "Hollywood", "Mollywood", "Pan India"].map((industry) => (
                                            <Link
                                                key={industry}
                                                href={`/vote-enroll?industry=${industry.toLowerCase().replace(" ", "-")}`}
                                                className="px-8 py-2 text-sm hover:text-primary transition-colors"
                                            >
                                                {industry}
                                            </Link>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="award-winners" className="border-b-0">
                                <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline hover:bg-accent hover:text-accent-foreground">
                                    <div className="flex items-center">
                                        <Trophy className={iconClass} />
                                        Award Winners
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-muted/30">
                                    <div className="flex flex-col">
                                        <AwardWinnersDropdown isMobile />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <Link href="/weekly-magazine" className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                            <Book className={iconClass} />
                            Magazine
                        </Link>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="about" className="border-b-0">
                                <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline hover:bg-accent hover:text-accent-foreground">
                                    <div className="flex items-center">
                                        <Info className={iconClass} />
                                        About
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-muted/30">
                                    <div className="flex flex-col">
                                        <Link href="/about" className="px-8 py-2 text-sm hover:text-primary transition-colors flex items-center">
                                            <Info className="h-4 w-4 mr-2" />
                                            About Us
                                        </Link>
                                        <Link href="/help" className="px-8 py-2 text-sm hover:text-primary transition-colors flex items-center">
                                            <HelpCircle className="h-4 w-4 mr-2" />
                                            Help For Us
                                        </Link>
                                        <Link href="/promotion" className="px-8 py-2 text-sm hover:text-primary transition-colors flex items-center">
                                            <Megaphone className="h-4 w-4 mr-2" />
                                            Contact for Promotion
                                        </Link>
                                        <Link href="/copyright" className="px-8 py-2 text-sm hover:text-primary transition-colors flex items-center">
                                            <Copyright className="h-4 w-4 mr-2" />
                                            Copyright Policy
                                        </Link>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </ScrollArea>

                {/* Footer - Pinned to Bottom */}
                <div className="p-4 border-t bg-background shrink-0 pb-safe-area mt-auto">
                    <div className="flex items-center justify-between px-4">
                        <Label htmlFor="theme-mode" className="text-sm font-medium">Dark Mode</Label>
                        <Switch
                            id="theme-mode"
                            checked={theme === "dark"}
                            onCheckedChange={toggleTheme}
                        />
                    </div>
                    <div className="mt-2">
                        <PushNotificationsToggle />
                    </div>
                    {user && (
                        <div className="px-4 mt-4">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="font-semibold">{user.displayName || "User"}</div>
                                </div>
                                <UserBadges />
                            </div>
                            <Button variant="destructive" className="w-full h-10" onClick={() => signOut()}>
                                Logout
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
