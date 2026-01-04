"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, TrendingUp, Clock } from "lucide-react"

export function SmartInsights() {
    return (
        <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-none shadow-inner">
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-full shadow-sm text-violet-600">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-foreground">AI Insight</h4>
                        <p className="text-xs text-muted-foreground">Movies with trailers get <span className="text-foreground font-semibold">2.3x</span> more engagement this week.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-full shadow-sm text-blue-600">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-foreground">Trend Alert</h4>
                        <p className="text-xs text-muted-foreground">"Tollywood" news is trending up by <span className="text-green-600 font-semibold">+15%</span>.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-full shadow-sm text-amber-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-foreground">Best Time</h4>
                        <p className="text-xs text-muted-foreground">Users engage most between <span className="text-foreground font-semibold">8 PM - 11 PM</span>.</p>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
