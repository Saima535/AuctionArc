import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const storage = multer.memoryStorage();

function fileFilter(req, file, callback) {
  if (!file.mimetype.startsWith("image/")) {
    callback(new ApiError(400, "Only image uploads are supported."));
    return;
  }

  callback(null, true);
}

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});
