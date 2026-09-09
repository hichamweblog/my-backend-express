import type { NextFunction, Request, Response } from "express";

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url} at ${new Date().toISOString()}`);

  next();
};

export default requestLogger;
