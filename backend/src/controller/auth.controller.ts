import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { users } from "../config/schema";
import { registerSchema, loginSchema } from "../validation/auth.validation";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Jwt from "jsonwebtoken";

export class Authentication {
  register = async (req: Request, res: Response) => {
    try {
      const validation = registerSchema.parse(req.body);
      const { name, email, password } = validation;

      const isExistingAcount = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
        

      if (isExistingAcount.length > 0) {
        return res.status(409).json({
          success: false,
          message: "email sudah terdaftar",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10) 

      const query = await db.insert(users).values({
        name : name,
        email : email,
        password : hashedPassword
      })

      return res.status(201).json({
        success: true,
        message: "akun berhasil dibuat",
      });
    } catch (error) {
        return res.status(500).json({
            success : false,
            message : `internal server error. : ${error}`
        })
    }
  };
}

export default new Authentication()
