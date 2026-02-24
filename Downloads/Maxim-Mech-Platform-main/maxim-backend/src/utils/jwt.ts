import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev'
const ACCESS_TOKEN_EXPIRES_IN = '30m'
const REFRESH_TOKEN_DAYS = 7

export interface TokenPayload {
    id: string
    email: string
    role: string
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export const generateRefreshToken = async (userId: string): Promise<string> => {
    const token = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS)

    await prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt
        }
    })

    return token
}
