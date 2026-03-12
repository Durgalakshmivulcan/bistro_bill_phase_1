import multer, { FileFilterCallback, Multer } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { uploadImage, uploadDocument, UploadResult } from '../services/s3.service';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// File size limits in bytes
const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || '5242880', 10); // 5MB
const MAX_DOCUMENT_SIZE = parseInt(process.env.MAX_DOCUMENT_SIZE || '10485760', 10); // 10MB
const MAX_CSV_SIZE = parseInt(process.env.MAX_CSV_SIZE || '10485760', 10); // 10MB

// Allowed MIME types
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_MIME_TYPES = ['application/pdf'];
const CSV_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/csv'];

// File type identifiers
type FileType = 'image' | 'document' | 'csv';

export interface MulterFile extends Express.Multer.File {
  buffer: Buffer;
}

export interface UploadedFile {
  url: string;
  key: string;
  bucket: string;
  originalName: string;
  mimetype: string;
  size: number;
}

export interface RequestWithUpload extends Request {
  uploadedFile?: UploadedFile;
  uploadedFiles?: UploadedFile[];
}

function getServerBaseUrl(req: Request): string {
  if (process.env.SERVER_PUBLIC_URL && process.env.SERVER_PUBLIC_URL.trim() !== '') {
    return process.env.SERVER_PUBLIC_URL.replace(/\/+$/, '');
  }
  const protocol = req.protocol || 'http';
  const host = req.get('host') || `localhost:${process.env.PORT || '5001'}`;
  return `${protocol}://${host}`;
}

function normalizeFolder(folder?: string): string {
  if (!folder) return 'uploads';
  return folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'uploads';
}

async function saveFileToAssets(
  req: Request,
  file: MulterFile,
  folder?: string
): Promise<UploadedFile> {
  const safeFolder = normalizeFolder(folder);
  const extensionFromName = path.extname(file.originalname);
  const extensionFromMime = file.mimetype.split('/')[1] || 'bin';
  const extension = (extensionFromName || `.${extensionFromMime}`).toLowerCase();
  const isProductImage = safeFolder === 'products';

  let absoluteDir: string;
  let publicUrlPrefix: string;
  let keyPrefix: string;

  if (isProductImage) {
    // Product images must be stored in frontend public folder so they are served at /images/products/*
    const cwd = process.cwd();
    const cwdBase = path.basename(cwd).toLowerCase();
    const frontendPublicDir =
      cwdBase === 'server'
        ? path.resolve(cwd, '../public/images/products')
        : path.resolve(cwd, 'public/images/products');

    absoluteDir = frontendPublicDir;
    publicUrlPrefix = '/images/products';
    keyPrefix = 'images/products';
  } else {
    const relativeDir = path.posix.join('catalog', safeFolder);
    // Resolve frontend assets path from workspace root first (works in dev + compiled server).
    const cwdAssetsRoot = path.resolve(process.cwd(), 'src/assets');
    let assetsRoot = cwdAssetsRoot;
    try {
      await fs.access(cwdAssetsRoot);
    } catch {
      assetsRoot = path.resolve(__dirname, '../../../src/assets');
    }
    absoluteDir = path.resolve(assetsRoot, relativeDir);
    publicUrlPrefix = `${getServerBaseUrl(req)}/assets/${relativeDir}`;
    keyPrefix = relativeDir;
  }

  await fs.mkdir(absoluteDir, { recursive: true });

  let fileName = `${Date.now()}-${randomUUID()}${extension}`;
  if (isProductImage) {
    // Keep exact uploaded filename for product images.
    const originalBaseName = path.basename(file.originalname);
    const hasExtension = path.extname(originalBaseName).length > 0;
    fileName = hasExtension ? originalBaseName : `${originalBaseName}${extension}`;
  }

  const absolutePath = path.resolve(absoluteDir, fileName);
  const key = path.posix.join(keyPrefix, fileName);
  const url = isProductImage
    ? `${publicUrlPrefix}/${fileName}`
    : `${publicUrlPrefix}/${fileName}`;

  await fs.writeFile(absolutePath, file.buffer);

  return {
    url,
    key,
    bucket: 'local-assets',
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

/**
 * Create a file filter for specific MIME types
 */
function createFileFilter(allowedMimeTypes: string[]) {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ): void => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
        )
      );
    }
  };
}

/**
 * Create multer instance for image uploads
 * Supports jpg, png, webp with max 5MB
 */
export const imageUpload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
  fileFilter: createFileFilter(IMAGE_MIME_TYPES),
});

/**
 * Create multer instance for document uploads
 * Supports PDF with max 10MB
 */
export const documentUpload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
  },
  fileFilter: createFileFilter(DOCUMENT_MIME_TYPES),
});

/**
 * Create multer instance for mixed uploads (images + documents)
 * Uses the larger limit (10MB for documents)
 */
export const mixedUpload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
  },
  fileFilter: createFileFilter([...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES]),
});

/**
 * Create multer instance for CSV uploads
 * Supports CSV with max 10MB
 */
export const csvUpload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_CSV_SIZE,
  },
  fileFilter: createFileFilter(CSV_MIME_TYPES),
});

/**
 * Determine file type from MIME type
 */
function getFileType(mimetype: string): FileType {
  if (IMAGE_MIME_TYPES.includes(mimetype)) {
    return 'image';
  }
  if (CSV_MIME_TYPES.includes(mimetype)) {
    return 'csv';
  }
  return 'document';
}

/**
 * Middleware to upload a single file to S3 after multer processing
 * @param folder - Optional folder name in S3
 */
export function uploadToS3Middleware(folder?: string) {
  return async (
    req: RequestWithUpload,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const file = req.file as MulterFile | undefined;

      if (!file) {
        next();
        return;
      }

      const fileType = getFileType(file.mimetype);
      let result: UploadResult;

      if (fileType === 'image') {
        result = await uploadImage({
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
          folder: folder || 'images',
        });
      } else {
        result = await uploadDocument({
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
          folder: folder || 'documents',
        });
      }

      req.uploadedFile = {
        url: result.url,
        key: result.key,
        bucket: result.bucket,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to upload a single file to local assets after multer processing
 * Saves files under server/assets/catalog/<folder>
 */
export function uploadToLocalAssetsMiddleware(folder?: string) {
  return async (
    req: RequestWithUpload,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const file = req.file as MulterFile | undefined;

      if (!file) {
        next();
        return;
      }

      req.uploadedFile = await saveFileToAssets(req, file, folder);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to upload multiple files to S3 after multer processing
 * @param folder - Optional folder name in S3
 */
export function uploadMultipleToS3Middleware(folder?: string) {
  return async (
    req: RequestWithUpload,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const files = req.files as MulterFile[] | undefined;

      if (!files || files.length === 0) {
        next();
        return;
      }

      const uploadedFiles: UploadedFile[] = [];

      for (const file of files) {
        const fileType = getFileType(file.mimetype);
        let result: UploadResult;

        if (fileType === 'image') {
          result = await uploadImage({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
            folder: folder || 'images',
          });
        } else {
          result = await uploadDocument({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
            folder: folder || 'documents',
          });
        }

        uploadedFiles.push({
          url: result.url,
          key: result.key,
          bucket: result.bucket,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });
      }

      req.uploadedFiles = uploadedFiles;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Error handler middleware for multer errors
 */
export function handleUploadError(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds the maximum allowed limit',
        },
      });
      return;
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: {
          code: 'UNEXPECTED_FILE',
          message: 'Unexpected file field',
        },
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message,
      },
    });
    return;
  }

  if (error.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: error.message,
      },
    });
    return;
  }

  next(error);
}

export { MAX_IMAGE_SIZE, MAX_DOCUMENT_SIZE, MAX_CSV_SIZE, IMAGE_MIME_TYPES, DOCUMENT_MIME_TYPES, CSV_MIME_TYPES };
