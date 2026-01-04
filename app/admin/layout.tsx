"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { userData, loading } = useAuth()
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (!loading) {
            if (!userData || userData.role !== "admin") {
                router.push("/")
            } else {
                setIsAdmin(true)
            }
        }
    }, [userData, loading, router])

    if (loading || !isAdmin) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 fixed inset-y-0 z-50">
                <AdminSidebar />
            </aside>

            {/* Mobile Sidebar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-40 flex items-center px-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <AdminSidebar />
                    </SheetContent>
                </Sheet>
                <span className="font-bold text-lg ml-4">Admin Dashboard</span>
            </div>

            <main className="flex-1 lg:pl-64 pt-16 lg:pt-0 p-6 bg-muted/10">
                {children}
            </main>
        </div>
    )
}
