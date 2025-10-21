// Models
const animeForm = require('./Model/AnimeForm');
const publisher = require('./Model/publisher');

// Libraries
const path = require('path');
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const { check, checkSchema, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// --- STATIC FILES (match Linux case!) ---
const PUBLIC_DIR = path.join(__dirname, 'Public'); // <-- "Public", not "public"
const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use(express.static(PUBLIC_DIR));               // /AnimeForm.html, /formStyleSheet.css, etc.
app.use('/uploads', express.static(UPLOADS_DIR));  // serve uploaded images

// Store successful submissions (if you need it later)
let submissions = [];

// --- Multer config ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, path.parse(file.originalname).name + '-' + Date.now() + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpg', 'image/jpeg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, JPEG, and PNG files are allowed.'), false);
  },
});

// --- CORS (simple global) ---
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// --- Default route -> your main page ---
app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'AnimeForm.html'));
});

// ===================== API ROUTES =====================

// Create (POST) with validations
app.post(
  '/animeForm/',
  upload.fields([{ name: 'title_image', maxCount: 1 }]),
  [
    checkSchema({
      title_image: {
        custom: {
          options: (value, { req }) => {
            const file = req.files['title_image'];
            if (!file) throw new Error('Please upload an image file.');
            const fileType = file[0].mimetype;
            if (!['image/png', 'image/jpg', 'image/jpeg'].includes(fileType)) {
              throw new Error('Only JPG, JPEG, and PNG files are allowed.');
            }
            return true;
          },
        },
      },
    }),
    check('anime_title', 'Please enter a title').isLength({ min: 1, max: 255 }),
    check('date', 'Please enter date in YYYY-MM-DD format.').matches(/^\d{4}-\d{2}-\d{2}$/),
    check('rating', 'Please enter a valid rating.').isIn(['TV-MA', 'TV-14', 'TV-PG', 'TV-G', 'TV-Y7']),
    check('style', 'Please enter an anime style.').notEmpty(),
    check('stars', 'Please enter a star score between 1 and 5.').isInt({ min: 1, max: 5 }),
    check('show_summary', 'Please enter a summary.').notEmpty(),
    check('num_of_seasons', 'Please enter a number of seasons.').isInt({ min: 1, max: 100 }),
    check('publisher_id', 'Please enter a valid publisher ID.').isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Request fields or files are invalid.', errors: errors.array() });
    }

    try {
      const animeData = {
        anime_title: req.body.anime_title,
        date: req.body.date,
        rating: req.body.rating,
        style: req.body.style,
        stars: req.body.stars,
        show_summary: req.body.show_summary,
        num_of_seasons: req.body.num_of_seasons,
        title_image: req.files['title_image'][0].filename,
        publisher_id: req.body.publisher_id,
      };

      await animeForm.insert(animeData);
      return res.json({ message: 'Form submitted and data saved successfully!' });
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to save anime to database.' });
    }
  }
);

// Read all with optional filters
app.get('/animeForm/', upload.none(), async (req, res) => {
  try {
    const queryParams = req.query;
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 10;
    const result = await animeForm.getAll({ ...queryParams, limit });
    res.json({ data: result });
  } catch (error) {
    console.error('Error in fetching data:', error);
    res.status(500).json({ message: 'Something went wrong with the server.' });
  }
});

// Read one
app.get('/animeForm/:id', async (req, res) => {
  try {
    const result = await animeForm.getById(req.params.id);
    if (result) res.json({ data: result });
    else res.status(404).json({ message: 'Anime not found.' });
  } catch (err) {
    console.error('Error fetching anime:', err);
    res.status(500).json({ message: 'Error fetching anime data.' });
  }
});

// Update
app.put(
  '/animeForm/:id',
  upload.fields([{ name: 'title_image', maxCount: 1 }]),
  [
    checkSchema({
      old_image: {
        custom: {
          options: (value, { req }) => {
            const file = req.files['title_image'];
            if (file && file.length > 0) {
              const t = file[0].mimetype;
              if (!['image/png', 'image/jpg', 'image/jpeg'].includes(t)) {
                throw new Error('Only JPG, JPEG, and PNG files are allowed.');
              }
            }
            return true;
          },
        },
      },
    }),
    check('anime_title', 'Please enter a title').isLength({ min: 1, max: 255 }),
    check('date', 'Please enter date in YYYY-MM-DD format.').matches(/^\d{4}-\d{2}-\d{2}$/),
    check('rating', 'Please enter a valid rating.').isIn(['TV-MA', 'TV-14', 'TV-PG', 'TV-G', 'TV-Y7']),
    check('style', 'Please enter an anime style.').notEmpty(),
    check('stars', 'Please enter a star score between 1 and 5.').isInt({ min: 1, max: 5 }),
    check('show_summary', 'Please enter a summary.').notEmpty(),
    check('num_of_seasons', 'Please enter a number of seasons.').isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Request fields or files are invalid.', errors: errors.array() });
    }

    const updatedData = {
      anime_title: req.body.anime_title,
      date: req.body.date,
      rating: req.body.rating,
      style: req.body.style,
      show_summary: req.body.show_summary,
      num_of_seasons: isNaN(parseInt(req.body.num_of_seasons)) ? null : parseInt(req.body.num_of_seasons),
      stars: isNaN(parseInt(req.body.stars)) ? null : parseInt(req.body.stars),
      title_image: req.files['title_image']?.[0]?.filename ?? req.body.old_image,
    };

    try {
      await animeForm.edit(req.params.id, updatedData);
      res.status(200).json({ message: 'Anime entry updated successfully.' });
    } catch (err) {
      console.error('Error updating record:', err);
      res.status(500).json({ error: 'Failed to update entry.', detail: err.message });
    }
  }
);

// Delete
app.delete('/animeForm/:id', async (req, res) => {
  try {
    const result = await animeForm.deleteById(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Anime entry not found.' });
    res.status(200).json({ message: 'Anime entry deleted successfully.' });
  } catch (err) {
    console.error('Error deleting record:', err);
    res.status(500).json({ error: 'Database delete failed.' });
  }
});

// Publishers
app.get('/publisher', async (_req, res) => {
  try {
    const result = await publisher.getAllPublishers();
    res.json(result);
  } catch (err) {
    console.error('Error fetching publishers:', err);
    res.status(500).json({ message: 'Server error fetching publishers.', error: err.message });
  }
});

// 404 fallback (optional)
app.use((req, res) => res.status(404).send('Not found'));

// --- START SERVER (bind to 0.0.0.0 so it’s reachable from the Internet) ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
