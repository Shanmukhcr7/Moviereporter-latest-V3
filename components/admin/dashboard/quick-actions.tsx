"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Film, Newspaper, Award, Vote } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                <ActionBtn href="/admin/movies" icon={Film} label="Movie" />
                <ActionBtn href="/admin/news" icon={Newspaper} label="News" />
                <ActionBtn href="/admin/celebrities" icon={Users} label="Celeb" />
                <ActionBtn href="/admin/awards" icon={Award} label="Award" />
                <ActionBtn href="/admin/polls" icon={Vote} label="Poll" />
                <ActionBtn href="/admin/users" icon={Users} label="Users" variant="secondary" />
            </CardContent>
        </Card>
    )
}

function ActionBtn({ href, icon: Icon, label, variant = "default" }: any) {
    return (
        <Link href={href} className="w-full">
            <Button variant={variant === "secondary" ? "secondary" : "outline"} className="w-full h-auto py-2 px-1 flex flex-col gap-1 border-dashed border hover:border-primary hover:bg-primary/5 shadow-sm">
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-tight">{label}</span>
            </Button>
        </Link>
    )
}
