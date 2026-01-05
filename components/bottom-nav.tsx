"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Film, Trophy, Newspaper, User } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Movies", href: "/movies", icon: Film },
        { name: "Awards", href: "/vote-enroll", icon: Trophy },
        { name: "News", href: "/news", icon: Newspaper },
        { name: "Profile", href: "/profile", icon: User },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <nav className="flex items-center justify-around px-2 h-20 w-full bg-background/80 backdrop-blur-xl rounded-t-[2rem] border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-safe relative">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex flex-col items-center justify-end w-full h-full pb-3 group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="liquid-bubble"
                                    className="absolute bottom-2 w-14 h-14 bg-primary/20 rounded-full z-0"
                                    style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                        mass: 1
                                    }}
                                >
                                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                                </motion.div>
                            )}

                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <div className="relative">
                                    {/* Levitating Icon */}
                                    <motion.div
                                        animate={{
                                            y: isActive ? -20 : 0,
                                            scale: isActive ? 1.2 : 1,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                            mass: 0.8
                                        }}
                                        className={cn(
                                            "p-2 rounded-full transition-colors duration-200",
                                            isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground group-hover:text-foreground bg-transparent"
                                        )}
                                    >
                                        <item.icon className="h-6 w-6" />
                                    </motion.div>
                                </div>

                                {/* Text Reveal */}
                                <div className="absolute -bottom-6 w-full text-center h-6 flex items-center justify-center">
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: -24 }}
                                            className="text-[10px] font-bold text-primary whitespace-nowrap"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
