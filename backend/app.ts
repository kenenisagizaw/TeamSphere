import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

// Routes placeholder
app.get('/', (_, res) => res.send('API running...'));

export default app;
