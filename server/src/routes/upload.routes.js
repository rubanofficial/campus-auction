import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  uploadMiddleware,
  uploadImages,
} from '../controllers/upload.controller.js';

const router = Router();

/**
 * Middleware wrapper to cleanly catch Multer errors and format standard 400 JSON responses
 */
const handleUpload = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Image size exceeds maximum allowed limit of 5 MB per file.',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Too many images. Maximum allowed is 4 images per listing.',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            error: 'Validation Error',
            message:
              'Unexpected upload field. Images must be sent under the field name "images".',
          });
        }
        return res.status(400).json({
          error: 'Validation Error',
          message: err.message,
        });
      }

      return res.status(400).json({
        error: 'Validation Error',
        message: err.message || 'Invalid file upload request.',
      });
    }
    next();
  });
};

/**
 * POST /api/uploads/images
 * Authenticated endpoint for uploading listing photos to Cloudinary
 */
router.post('/images', requireAuth, handleUpload, uploadImages);

export default router;
