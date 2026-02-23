import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
const app = express()
const port = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only'

app.use(cors())
app.use(express.json())

// --- Schemas ---
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

const refreshSchema = z.object({
    refreshToken: z.string().uuid(),
})

// --- Auth Routes ---

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body)

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        // Generate JWT Access Token (short lived, e.g. 15m or 30m)
        const token = jwt.sign(
            { sub: user.id, email: user.email, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '30m' }
        )

        // Generate Refresh Token / Session (long lived, e.g. 7d)
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                token: crypto.randomUUID(), // or a strong random string
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
        })

        res.json({
            accessToken: token,
            refreshToken: session.token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors })
        }
        console.error(error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.post('/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = refreshSchema.parse(req.body)

        const session = await prisma.session.findUnique({
            where: { token: refreshToken },
            include: { user: true }
        })

        if (!session || session.expiresAt < new Date() || !session.user.active) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' })
        }

        // Generate new access token
        const token = jwt.sign(
            { sub: session.user.id, email: session.user.email, name: session.user.name, role: session.user.role },
            JWT_SECRET,
            { expiresIn: '30m' }
        )

        // Optionally rotate the refresh token here
        // For now, keep it simple and just return a new access token

        res.json({
            accessToken: token,
            refreshToken: session.token // returning same refresh token
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors })
        }
        console.error(error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.post('/auth/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body
        if (refreshToken) {
            await prisma.session.deleteMany({
                where: { token: refreshToken }
            })
        }
        res.json({ success: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// --- Middleware ---
export const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]
    try {
        const payload = jwt.verify(token, JWT_SECRET)
        // @ts-ignore
        req.user = payload
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

// Role-based Access Control Middleware
export const requireRole = (allowedRoles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // @ts-ignore
        const userRole = req.user?.role
        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
        }
        next()
    }
}

// Example protected route connecting the heartbeat idea
app.get('/api/health', requireAuth, (req, res) => {
    res.json({ status: 'ok', user: (req as any).user })
})

// Example protected admin route demonstrating requireRole
app.get('/api/admin/stats', requireAuth, requireRole(['admin', 'owner']), (req, res) => {
    res.json({ success: true, message: 'Admin access granted.', user: (req as any).user })
})

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})
