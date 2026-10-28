import { db } from "../../config/db";
import { passwordResetRequests } from "../../config/schema";
import { usersTable } from "../../config/schema";
import { Request, Response, NextFunction } from "express";
import { createVerificationSchema, reviewVerificationSchema } from "../../validation/verification.validation";

export class HRfeatures {
  VerificationForgetPassword = async (req: Request, res: Response) => {
    try {
      const requestValidation = createVerificationSchema.parse(req.body);
      const { userId } = requestValidation;

      const [makeRequest] = await db.insert(passwordResetRequests).values({
        userId : userId
      }).returning();

      if (!makeRequest) {
        return res.status(400).json({
          success : false,
          message : "gagal mengirim permintaan reset code"
        })
      }
    } catch (error) {}
  };
}
