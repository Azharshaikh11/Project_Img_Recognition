// Import necessary modules
const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3000;


// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-southeast-1'
});

const rekognition = new AWS.Rekognition();

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).single('image');

// Set view engine to EJS
app.set('view engine', 'ejs');

// Use body parser middleware and static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Render the main page
app.get('/', (req, res) => {
    res.render('index', { error: null, labels: [] });
});

// Handle image upload and analysis
app.post('/upload', (req, res) => {
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            return res.render('index', { error: err.message, labels: [] });
        } else if (err) {
            return res.render('index', { error: 'Error uploading file', labels: [] });
        }

        const image = req.file;

        if (image) {
            // Handle image analysis
            const imagePath = image.path;
            const imageBuffer = fs.readFileSync(imagePath);
            const params = {
                Image: {
                    Bytes: imageBuffer
                }
            };

            rekognition.detectLabels(params, (err, data) => {
                if (err) {
                    console.log(err, err.stack);
                    res.render('index', { error: 'Error analyzing image', labels: [] });
                } else {
                    res.render('index', { error: null, labels: data.Labels });
                }
            });
        } else {
            res.render('index', { error: 'Please upload an image file', labels: [] });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});


