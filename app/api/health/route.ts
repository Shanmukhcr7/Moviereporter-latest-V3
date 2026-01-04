import { NextResponse } from 'next/server'
import os from 'os'

export const dynamic = 'force-dynamic' // Ensure this is not cached

export async function GET() {
    try {
        const uptime = os.uptime()
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const usedMem = totalMem - freeMem
        const memUsage = (usedMem / totalMem) * 100
        const loadAvg = os.loadavg() // [1min, 5min, 15min]

        return NextResponse.json({
            status: 'online',
            uptime: uptime,
            memory: {
                total: totalMem,
                free: freeMem,
                used: usedMem,
                usagePercentage: Math.round(memUsage)
            },
            load: {
                current: loadAvg[0],
                average: loadAvg,
                percentage: Math.min((loadAvg[0] / os.cpus().length) * 100, 100).toFixed(1) // Rough CPU usage estimate
            },
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Failed to fetch metrics' }, { status: 500 })
    }
}
