"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Film,
    Users,
    Star,
    Newspaper,
    Trophy,
    BarChart2,
    Settings,
    ShieldAlert,
    MessageSquare,
    LogOut,
    Bell
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const sidebarItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Movies", href: "/admin/movies", icon: Film },
    { name: "Celebrities", href: "/admin/celebrities", icon: Star },
    { name: "News & Blogs", href: "/admin/news", icon: Newspaper },
    { name: "Polls", href: "/admin/polls", icon: BarChart2 },
    { name: "Awards (Vote Enroll)", href: "/admin/awards", icon: Trophy },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Activity Logs", href: "/admin/logs", icon: BarChart2, protected: true },
    { name: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { userData } = useAuth()
    const isSuperAdmin = userData?.role === 'super_admin'

    const filteredItems = sidebarItems.filter(item => !item.protected || isSuperAdmin)

    return (
        <div className="py-4 flex flex-col h-full bg-secondary/10 border-r">
            <div className="px-6 mb-6">
                <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
                    <Film className="h-6 w-6 text-primary" />
                    <span>Admin</span>
                </Link>
            </div>
            <div className="flex-1 px-4 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => (
                    <Button
                        key={item.href}
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-3",
                            pathname === item.href && "bg-secondary"
                        )}
                        asChild
                    >
                        <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    </Button>
                ))}
            </div>
            <div className="p-4 border-t mt-auto">
                <Button variant="outline" className="w-full gap-2" asChild>
                    <Link href="/">
                        <LogOut className="h-4 w-4" />
                        Exit Admin
                    </Link>
                </Button>
            </div>
        </div>
    )
}
