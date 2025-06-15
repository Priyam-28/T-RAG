import express from 'express';
import cors from 'cors';
const app = express();



app.use(cors());

app.listen(8000, () => {
    console.log('Server is running on port 8000');

});

app.get('/', (req, res) => {
    res.send('Sab changa si');
});