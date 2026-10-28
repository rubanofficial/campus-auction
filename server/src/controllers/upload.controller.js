import multer from 'multer';
import cloudinary, {
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from '../config/cloudinary.js';

// Max 4 photos, 5MB each
const MAX_FILES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT_REGEX = /\.(jpe?g|png|webp)$/i;

/**
 * Validate file magic numbers to ensure genuine image buffers
 */
const isValidImageBuffer = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  // WEBP: RIFF .... WEBP
  const isWebp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  return isJpeg || isPng || isWebp;
};

// Multer instance for memory storage
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new Error(
          'Unsupported file type. Only JPG, PNG, and WEBP images are allowed.'
        ),
        false
      );
    }
    if (!ALLOWED_EXT_REGEX.test(file.originalname)) {
      return cb(
        new Error(
          'Unsupported file extension. Only .jpg, .jpeg, .png, and .webp are allowed.'
        ),
        false
      );
    }
    cb(null, true);
  },
}).array('images', MAX_FILES);

/**
 * Handle image uploads to Cloudinary
 * POST /api/uploads/images
 */
export const uploadImages = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    // 1. Verify files are present
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No image files provided under field name "images".',
      });
    }

    if (req.files.length > MAX_FILES) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Maximum of ${MAX_FILES} images can be uploaded per listing.`,
      });
    }

    // 2. Verify server-side Cloudinary configuration
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message:
          'Cloudinary image hosting is not configured on the server. Please check environment variables.',
      });
    }

    // 3. Inspect buffer contents for genuine image signatures
    for (const file of req.files) {
      if (!isValidImageBuffer(file.buffer)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `File "${file.originalname}" is not a valid image format.`,
        });
      }
    }

    // 4. Upload files to Cloudinary
    const uploadedImages = [];

    for (const file of req.files) {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: 'campus-auction/listings',
      });

      uploadedPublicIds.push(result.public_id);
      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    }

    return res.status(200).json({
      message: 'Images uploaded successfully.',
      images: uploadedImages,
    });
  } catch (error) {
    // Cleanup any partial uploads if an error occurs mid-batch
    if (uploadedPublicIds.length > 0) {
      for (const publicId of uploadedPublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cleanupErr) {
          console.error(
            `[Upload] Failed to clean up public ID ${publicId}: ${cleanupErr.message}`
          );
        }
      }
    }

    console.error(`[Upload] Image upload error: ${error.message}`);
    return res.status(500).json({
      error: 'Upload Failed',
      message: error.message || 'Failed to upload images to Cloudinary.',
    });
  }
};
