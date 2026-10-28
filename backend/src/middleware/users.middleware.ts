import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export interface AuthRequest extends Request {
    user? : {
        userId : number,
        email : string,
        role : string 
    };
}

export const authenticate = (req: AuthRequest, res: Response, next:NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message : "sesi habis, silahkan login kembali"})
    }
    const parts = authHeader.split(" ")
    const token= parts[1]
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        req.user = decoded
        next()
    } catch (error) {
        return res.status(403).json({ message : "token tidak valid"})
    }
}

