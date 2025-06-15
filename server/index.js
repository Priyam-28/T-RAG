import express from 'express';
import cors from 'cors';
const app = express();
import multer from 'multer';

app.use(cors());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.send('Sab changa si');
});

app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
    
    return res.json({ message: 'uploaded' });
});


app.listen(8000, () => {
    console.log('Server is running on port 8000');

});