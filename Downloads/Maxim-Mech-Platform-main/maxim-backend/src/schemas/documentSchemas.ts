import { z } from 'zod'

export const documentUploadSchema = z.object({
    docType: z.enum(['health_safety', 'cad_design', 'site_plan', 'contract', 'bid', 'other']).optional().default('other')
})

export const documentQuerySchema = z.object({
    docType: z.string().optional(),
    status: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0')
})
