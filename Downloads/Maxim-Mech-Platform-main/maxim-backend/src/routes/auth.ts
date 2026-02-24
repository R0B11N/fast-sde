import { Router } from 'express'
import { registerUser, loginUser, refreshUserToken, logoutUser, getMe } from '../services/authService'
import { registerSchema, loginSchema, refreshSchema } from '../schemas/authSchemas'
import { validateRequest } from '../utils/validate'
import { authenticate } from '../middleware/authenticate'
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter'

const router = Router()

router.post('/register', registerLimiter, validateRequest(registerSchema), async (req, res, next) => {
    try {
        const user = await registerUser(req.body)
        res.status(201).json(user)
    } catch (e) {
        next(e)
    }
})

router.post('/login', loginLimiter, validateRequest(loginSchema), async (req, res, next) => {
    try {
        const ip = req.ip || req.connection.remoteAddress || 'unknown'
        const data = await loginUser(req.body, ip)
        res.status(200).json(data)
    } catch (e) {
        next(e)
    }
})

router.post('/refresh', validateRequest(refreshSchema), async (req, res, next) => {
    try {
        const data = await refreshUserToken(req.body)
        res.status(200).json(data)
    } catch (e) {
        next(e)
    }
})

router.post('/logout', authenticate, validateRequest(refreshSchema), async (req, res, next) => {
    try {
        await logoutUser(req.body.refreshToken)
        res.status(200).json({ message: 'Logged out successfully' })
    } catch (e) {
        next(e)
    }
})

router.get('/me', authenticate, async (req, res, next) => {
    try {
        const userId = req.user!.id
        const user = await getMe(userId)
        res.status(200).json(user)
    } catch (e) {
        next(e)
    }
})

export default router
