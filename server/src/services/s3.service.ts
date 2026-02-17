import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// S3 Configuration
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

const s3Client = new S3Client(s3Config);
const bucketName = process.env.AWS_S3_BUCKET || 'bistrobill-uploads';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export interface FileUploadParams {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  folder?: string;
}

/**
 * Generate a unique S3 key for a file
 */
function generateS3Key(folder: string, filename: string): string {
  const timestamp = Date.now();
  const uuid = randomUUID();
  const extension = filename.split('.').pop() || '';
  return `${folder}/${timestamp}-${uuid}.${extension}`;
}

/**
 * Get the public URL for an S3 object
 */
function getPublicUrl(key: string): string {
  return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Upload a file to S3
 * @param params - File upload parameters
 * @returns Promise with upload result containing URL and key
 */
export async function uploadToS3(params: FileUploadParams): Promise<UploadResult> {
  const { buffer, mimetype, originalname, folder = 'uploads' } = params;

  const key = generateS3Key(folder, originalname);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  return {
    url: getPublicUrl(key),
    key,
    bucket: bucketName,
  };
}

/**
 * Delete a file from S3
 * @param key - The S3 object key to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get a signed URL for temporary access to a private S3 object
 * @param key - The S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Promise with the signed URL
 */
export async function getS3SignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Upload an image to S3
 * Supports jpg, png, webp with max 5MB
 * @param params - File upload parameters
 * @returns Promise with upload result
 */
export async function uploadImage(params: FileUploadParams): Promise<UploadResult> {
  return uploadToS3({
    ...params,
    folder: params.folder || 'images',
  });
}

/**
 * Upload a document to S3
 * Supports PDF with max 10MB
 * @param params - File upload parameters
 * @returns Promise with upload result
 */
export async function uploadDocument(params: FileUploadParams): Promise<UploadResult> {
  return uploadToS3({
    ...params,
    folder: params.folder || 'documents',
  });
}

/**
 * Extract S3 key from a full S3 URL
 * @param url - The full S3 URL
 * @returns The S3 key or null if not a valid S3 URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlPattern = new RegExp(`https://${bucketName}.s3.[\\w-]+.amazonaws.com/(.+)`);
    const match = url.match(urlPattern);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export { s3Client, bucketName };
