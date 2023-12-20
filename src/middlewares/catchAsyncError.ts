import { Request, Response, NextFunction } from 'express';

export = (newFn: (req: Request, res: Response, next: NextFunction) => any) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(newFn(req, res, next)).catch(next);
