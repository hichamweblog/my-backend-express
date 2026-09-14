import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import requestLogger from './middlewares/logger.middleware.js';
import authRouter from './routes/auth.routes.js';
import usersRouter from './routes/users.routes.js';

// App initialization

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Route
app.use('/auth', authRouter);
app.use('/users', usersRouter);

// Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
