const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'misc';
    if (req.path.includes('avatar')) folder = 'avatars';
    if (req.path.includes('moment')) folder = 'moments';
    if (req.path.includes('chat')) folder = 'chat';
    
    const targetDir = path.join(uploadDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filters
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const codeFilter = (req, file, cb) => {
  const allowedExts = [
    '.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.css', '.scss', '.less', 
    '.json', '.md', '.py', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rs', 
    '.php', '.rb', '.sh', '.bat', '.sql', '.xml', '.yaml', '.yml', '.txt', '.ini', '.conf'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only code/text files are allowed!'), false);
  }
};

const uploadImage = multer({ 
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

const uploadCode = multer({ 
  storage: storage,
  fileFilter: codeFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

class UploadController {
  // Middleware for image upload
  uploadImage(fieldName) {
    return uploadImage.single(fieldName);
  }

  // Middleware for code file upload
  uploadCode(fieldName) {
    return uploadCode.single(fieldName);
  }

  // Controller method to return file URL
  async handleUpload(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }
    
    try {
      const filePath = req.file.path;
      const fileName = req.file.filename;

      const formData = new FormData();
      formData.append('cacheControl', '3600');
      formData.append('', fs.createReadStream(filePath), {
        filename: fileName,
        contentType: req.file.mimetype
      });

      const targetUrl = `${process.env.SUPABASE_URL}/storage/v1/object/wenjian/anonymous/${encodeURIComponent(fileName)}`;

      const response = await axios.post(targetUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'apikey': process.env.SUPABASE_KEY,
          'authorization': `Bearer ${process.env.SUPABASE_KEY}`,
          'x-upsert': 'true'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      // Cleanup local file
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete local file:', err);
      });

      res.json({ 
        url: targetUrl,
        filename: fileName,
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalName: req.file.originalname
      });
    } catch (error) {
      console.error('Upload proxy error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
  }
}


module.exports = new UploadController();
