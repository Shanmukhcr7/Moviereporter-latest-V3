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
                <ScrollArea className="flex-1 w-full min-h-0">
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
                <div className="p-4 border-t bg-background shrink-0 pb-safe-area mt-auto space-y-4">
                    {/* Social Media Icons */}
                    <div className="flex items-center justify-center gap-6 pb-2">
                        {/* Instagram */}
                        <a href="#" className="text-muted-foreground hover:text-[#E1306C] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                        </a>
                        {/* Facebook */}
                        <a href="#" className="text-muted-foreground hover:text-[#1877F2] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                        </a>
                        {/* Twitter / X */}
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                        </a>
                        {/* YouTube */}
                        <a href="#" className="text-muted-foreground hover:text-[#FF0000] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                        </a>
                        {/* WhatsApp */}
                        <a href="#" className="text-muted-foreground hover:text-[#25D366] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                        </a>
                    </div>

                    <div className="flex items-center justify-between px-4">
                        <Label htmlFor="theme-mode" className="text-sm font-medium">Dark Mode</Label>
                        <Switch
                            id="theme-mode"
                            checked={theme === "dark"}
                            onCheckedChange={toggleTheme}
                        />
                    </div>

                    {user ? (
                        <div className="px-4">
                            <Button variant="destructive" className="w-full h-10" onClick={() => signOut()}>
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="px-4 grid grid-cols-2 gap-2">
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button asChild className="w-full">
                                <Link href="/signup">Sign Up</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
