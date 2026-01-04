"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, UserX, Key } from "lucide-react"

export function SecuritySnapshot() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Shield className="h-4 w-4" /> Security Snapshot
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Total Admins</span>
                    </div>
                    <span className="font-bold">1</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-sm">
                        <UserX className="h-4 w-4 text-red-500" />
                        <span>Blocked Users</span>
                    </div>
                    <span className="font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <Key className="h-4 w-4 text-amber-500" />
                        <span>Failed Logins (24h)</span>
                    </div>
                    <span className="font-bold">0</span>
                </div>
            </CardContent>
        </Card>
    )
}
