import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from "bullmq";

const app = express();
const queue = new Queue("file-queue", {
    connection: {
        host: 'localhost',
        port: 6379
    }
});
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
    queue.add('file-queue', JSON.stringify({
        filename: req.file.filename,
        originalname: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path
    }))
    return res.json({message: 'uploaded'});
});


app.listen(8000, () => {
    console.log('Server is running on port 8000');

});