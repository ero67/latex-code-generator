// src/types/express/index.d.ts
import "multer";

declare global {
  namespace Express {
    export interface Request {
      file?: Multer.File;
    }
  }
}
