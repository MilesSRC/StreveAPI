// Base
import express from 'express';
import mongoose from 'mongoose';

// Middlewares
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Routes
import UserRouter from './routes/users';
import AuthRouter from './routes/auth';

// App
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Development Hotfix

// Routes
app.use('/api/users', UserRouter);
app.use('/api/auth', AuthRouter);

// DB
await mongoose.connect(process.env.MONGO || 'mongodb://localhost:27017/strive');

// Server
app.listen(process.env.PORT || 8800, () => {
  console.log('Server is running on port 8800');
})