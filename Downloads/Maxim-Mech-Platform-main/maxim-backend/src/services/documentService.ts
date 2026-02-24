import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { documentQuerySchema } from '../schemas/documentSchemas'
import fs from 'fs'

export const uploadDocumentRecord = async (
    userId: string,
    file: Express.Multer.File,
    docType: string
) => {
    // Generate db entry
    const doc = await prisma.document.create({
        data: {
            originalName: file.originalname,
            filename: file.filename,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            filePath: file.path,
            docType: docType,
            uploadedById: userId,
            status: 'uploaded'
        },
        select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            docType: true,
            uploadedAt: true,
            status: true
        }
    })

    return doc
}

export const listUserDocuments = async (userId: string, queryParams: z.infer<typeof documentQuerySchema>) => {
    const { docType, status, limit, offset } = queryParams

    const whereClause: any = { uploadedById: userId }
    if (docType) whereClause.docType = docType
    if (status) whereClause.status = status

    const safeLimit = Math.min(limit, 100)

    const [documents, total] = await Promise.all([
        prisma.document.findMany({
            where: whereClause,
            take: safeLimit,
            skip: offset,
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                originalName: true,
                mimeType: true,
                sizeBytes: true,
                docType: true,
                uploadedAt: true,
                status: true
            }
        }),
        prisma.document.count({ where: whereClause })
    ])

    return { documents, total, limit: safeLimit, offset }
}

export const getDocumentById = async (userId: string, docId: string) => {
    const doc = await prisma.document.findUnique({
        where: { id: docId }
    })

    if (!doc) throw { status: 404, message: 'Document not found' }
    if (doc.uploadedById !== userId) throw { status: 403, message: 'Forbidden' }

    return {
        id: doc.id,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        docType: doc.docType,
        filePath: doc.filePath,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        extractedText: doc.extractedText
    }
}

export const deleteDocumentById = async (userId: string, docId: string) => {
    const doc = await prisma.document.findUnique({
        where: { id: docId }
    })

    if (!doc) throw { status: 404, message: 'Document not found' }
    if (doc.uploadedById !== userId) throw { status: 403, message: 'Forbidden' }

    // Remote file disk cleanup
    if (fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath)
    }

    await prisma.document.delete({ where: { id: docId } })
}
