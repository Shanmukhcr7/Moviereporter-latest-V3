"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Terminal, Search, Filter, RefreshCw, Clock, User, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface LogEntry {
    adminName: string
    adminEmail: string
    action: string
    resourceType: string
    resourceId: string
    resourceTitle?: string
    details?: string
    timestamp: string
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [actionFilter, setActionFilter] = useState("ALL")
    const [resourceFilter, setResourceFilter] = useState("ALL")

    useEffect(() => {
        fetchLogs()
    }, [])

    useEffect(() => {
        // Client-side filtering
        let result = logs

        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(log =>
                log.adminName.toLowerCase().includes(lower) ||
                log.resourceTitle?.toLowerCase().includes(lower) ||
                log.details?.toLowerCase().includes(lower) ||
                log.adminEmail.toLowerCase().includes(lower)
            )
        }

        if (actionFilter !== "ALL") {
            result = result.filter(log => log.action === actionFilter)
        }

        if (resourceFilter !== "ALL") {
            result = result.filter(log => log.resourceType === resourceFilter)
        }

        setFilteredLogs(result)
    }, [logs, searchTerm, actionFilter, resourceFilter])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/logs?limit=30") // Fetch last 30 lines
            const data = await res.json()
            if (data.logs) {
                setLogs(data.logs)
                setFilteredLogs(data.logs)
            }
        } catch (error) {
            console.error("Failed to fetch logs", error)
        } finally {
            setLoading(false)
        }
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case "CREATE": return "bg-green-500/10 text-green-500 border-green-500/20"
            case "UPDATE": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "DELETE": return "bg-red-500/10 text-red-500 border-red-500/20"
            case "LOGIN": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
            default: return "bg-secondary text-secondary-foreground"
        }
    }

    // Extract unique resource types for filter
    const resourceTypes = Array.from(new Set(logs.map(l => l.resourceType))).sort()

    return (
        <div className="min-h-screen bg-background space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-mono tracking-tight text-primary/80">
                        SYSTEM_LOGS
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs">
                        /var/log/admin-activity.log
                    </p>
                </div>
                <Button onClick={fetchLogs} variant="outline" className="gap-2 font-mono text-xs">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    REFRESH_DATA
                </Button>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by admin, movie, details..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Action Type" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Actions</SelectItem>
                                <SelectItem value="CREATE">Create</SelectItem>
                                <SelectItem value="UPDATE">Update</SelectItem>
                                <SelectItem value="DELETE">Delete</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={resourceFilter} onValueChange={setResourceFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Resource Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Resources</SelectItem>
                                {resourceTypes.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Resource</TableHead>
                                    <TableHead className="w-[40%]">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">Loading logs...</TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No logs found matching filters.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log, i) => (
                                        <TableRow key={i} className="hover:bg-muted/50">
                                            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.adminName}</span>
                                                    <span className="text-xs text-muted-foreground">{log.adminEmail}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.resourceType}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1" title={log.resourceTitle || log.resourceId}>
                                                        {log.resourceTitle || log.resourceId}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-foreground/80">
                                                {log.details || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground text-center">
                        Showing {filteredLogs.length} of {logs.length} records. Logs are stored locally on the server.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
