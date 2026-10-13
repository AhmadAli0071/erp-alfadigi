import path from 'path';
import fs from 'fs';

/**
 * Disk storage for face-capture photos taken at clock-in.
 * Survives git deploys (untracked, no `git clean`). cwd = server/.
 * Files are deleted the next day at 08:00 AM PKT by the retention job.
 */
export const FACE_UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads', 'faces');
fs.mkdirSync(FACE_UPLOAD_ROOT, { recursive: true });
