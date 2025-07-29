import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database';

const app = express();

connectDB();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});