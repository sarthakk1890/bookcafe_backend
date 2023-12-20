import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandler';

interface UserInterface extends Express.User {
    role: string;
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies["connect.sid"];
    // console.log(token);

    if (!token) {
        return next(new ErrorHandler("Not Logged In", 401));
    }

    next();
}

//Authorizing Role
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {

    const user: UserInterface | undefined = req.user as UserInterface;

    if (user.role !== "admin") {
      return next(new ErrorHandler("Only Admin Allowed", 405));
    }
    next();
  };