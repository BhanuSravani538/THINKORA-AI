import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler.js';

// Use memory storage so buffer can be analyzed for text extraction & claim triangulation
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdfMime || isPdfExt) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type. Only PDF documents (.pdf) are supported for evidence analysis.', 400) as any);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 Megabytes limit
    files: 1,
  },
  fileFilter,
});

export const uploadPdf = upload.single('file');
