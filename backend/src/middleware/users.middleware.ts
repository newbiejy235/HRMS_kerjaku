import { Response, Request, NextFunction } from "express";
import  Jwt  from "jsonwebtoken";



export interface AuthRequest extends Request {
    user? : {
        id : number,
        email : string,
        role : string 
    };
}

export const authenticate = (req: AuthRequest, res: Response, next:NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message : "sesi habiis, silahkan login kembali"})
    }
    const parts = authHeader.split(" ")
    const token= parts[1]
    try {
        const decoded = Jwt.verify(token, process.env.JWT_SECRET || "hello world") as any
        req.user = decoded
        next()
    } catch (error) {
        return res.status(403).json({ message : "token tidak valid"})
    }
}