import { Request } from "express";

export const getIdParam = (req: Request): string => req.params.id as string;