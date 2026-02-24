import { Router } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { authenticate } from '../middleware/authenticate'
import { uploadDocumentRecord, listUserDocuments, getDocumentById, deleteDocumentById } from '../services/documentService'
import { documentQuerySchema, documentUploadSchema } from '../schemas/documentSchemas'

const router = Router()

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '50')) * 1024 * 1024
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/vnd.dwg',
    'image/vnd.dxf'
]

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || 'uploads')
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop()
        const unsafeName = `${Date.now()}-${uuidv4()}.${ext}`
        cb(null, unsafeName)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            // Must return an object that errorHandler explicitly checks for since multer swallows errors sometimes
            return cb(new Error('File type not allowed'))
        }
        cb(null, true)
    }
})

router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' })
        }

        const parseResult = documentUploadSchema.safeParse(req.body)
        const docType = parseResult.success ? parseResult.data.docType : 'other'

        const doc = await uploadDocumentRecord(req.user!.id, req.file, docType)
        res.status(201).json(doc)
    } catch (e) {
        next(e)
    }
})

router.get('/', authenticate, async (req, res, next) => {
    try {
        const queryParams = documentQuerySchema.parse(req.query)
        const data = await listUserDocuments(req.user!.id, queryParams)
        res.status(200).json(data)
    } catch (e) {
        next(e)
    }
})

router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const doc = await getDocumentById(req.user!.id, req.params.id)
        res.status(200).json(doc)
    } catch (e) {
        next(e)
    }
})

router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        await deleteDocumentById(req.user!.id, req.params.id)
        res.status(200).json({ message: 'Document deleted successfully' })
    } catch (e) {
        next(e)
    }
})

export default router
