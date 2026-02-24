import { Request, Response, NextFunction } from 'express'

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Log internally
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, err)

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' })
    }

    // Multer file type error
    if (err.message === 'File type not allowed') {
        return res.status(400).json({ error: 'File type not allowed. Use PDF, PNG, JPG, JPEG, DWG, or DXF.' })
    }

    // Zod validation error
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation failed',
            fields: err.errors.map((e: any) => ({
                field: e.path.join('.'),
                message: e.message
            }))
        })
    }

    // Handle generic JWT Verify Errors cleanly
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' })
    }

    // Everything else
    res.status(500).json({ error: 'Internal server error' })
}
