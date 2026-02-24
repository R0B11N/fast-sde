import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import { prisma } from './lib/prisma'

import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'
import { errorHandler } from './middleware/errorHandler'
import { globalLimiter } from './middleware/rateLimiter'

dotenv.config()

const app = express()

// Dynamic CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',')
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
}))

app.use(express.json())
app.use(globalLimiter) // apply global rate limiter to everything

// Ensure upload directory exists programmatically
const uploadDir = process.env.UPLOAD_DIR || 'uploads'
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

// Routes
app.use('/auth', authRoutes)
app.use('/documents', documentRoutes)

app.get('/health', async (req, res) => {
    let dbStatus = 'connected'
    try {
        await prisma.$queryRaw`SELECT 1`
    } catch (e) {
        dbStatus = 'error'
    }

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus
    })
})

// Global Error Handler must be the last middleware
app.use(errorHandler)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`🚀 Maxim Backend Server running on port ${PORT}`)
})
