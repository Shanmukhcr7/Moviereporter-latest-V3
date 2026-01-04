import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function MovieCardSkeleton() {
    return (
        <Card className="h-full border-border/50 bg-card/50 backdrop-blur overflow-hidden">
            <div className="aspect-[2/3] w-full relative">
                <Skeleton className="h-full w-full" />
            </div>
            <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="pt-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
            </CardContent>
        </Card>
    )
}

export function NewsCardSkeleton() {
    return (
        <Card className="h-full border-border/50 bg-card/50 backdrop-blur overflow-hidden">
            <div className="aspect-video w-full relative">
                <Skeleton className="h-full w-full" />
            </div>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-16 w-full mt-2" />
            </CardContent>
        </Card>
    )
}
