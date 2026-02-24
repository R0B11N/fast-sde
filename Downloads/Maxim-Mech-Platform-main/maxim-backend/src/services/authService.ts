import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt'
import { z } from 'zod'
import { registerSchema, loginSchema, refreshSchema } from '../schemas/authSchemas'

export const registerUser = async (data: z.infer<typeof registerSchema>) => {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingUser) {
        throw { status: 409, message: 'Email already registered' }
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await prisma.user.create({
        data: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            passwordHash: hashedPassword,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
        }
    })

    return user
}

export const loginUser = async (data: z.infer<typeof loginSchema>, ipAddress: string) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } })

    let success = false
    if (user && await comparePassword(data.password, user.passwordHash)) {
        success = true
    }

    await prisma.loginAttempt.create({
        data: {
            email: data.email,
            ipAddress,
            success,
            userId: success && user ? user.id : null
        }
    })

    if (!success || !user) {
        throw { status: 401, message: 'Invalid credentials' } // Generic message
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
    })

    const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role
    })

    const refreshToken = await generateRefreshToken(user.id)

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
    }
}

export const refreshUserToken = async (data: z.infer<typeof refreshSchema>) => {
    const rfDB = await prisma.refreshToken.findUnique({
        where: { token: data.refreshToken },
        include: { user: true }
    })

    if (!rfDB || rfDB.revoked || rfDB.expiresAt < new Date()) {
        throw { status: 401, message: 'Invalid or expired refresh token' }
    }

    // Revoke old token
    await prisma.refreshToken.update({
        where: { id: rfDB.id },
        data: { revoked: true }
    })

    // Generate new payload pair
    const accessToken = generateAccessToken({
        id: rfDB.user.id,
        email: rfDB.user.email,
        role: rfDB.user.role
    })

    const newRefreshToken = await generateRefreshToken(rfDB.user.id)

    return { accessToken, refreshToken: newRefreshToken }
}

export const logoutUser = async (refreshToken: string) => {
    try {
        await prisma.refreshToken.update({
            where: { token: refreshToken },
            data: { revoked: true }
        })
    } catch (e) {
        // Return success even if not found (idempotent)
    }
}

export const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            lastLogin: true
        }
    })

    if (!user) throw { status: 404, message: 'User not found' }
    return user
}
