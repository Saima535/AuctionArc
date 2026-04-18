import { cloudinary, cloudinaryConfigured } from "../config/cloudinary.js";

export async function uploadImageBuffer(fileBuffer, folder, filename) {
  if (!cloudinaryConfigured || !fileBuffer) {
    return null;
  }

  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:image/jpeg;base64,${base64}`;

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: filename,
    resource_type: "image",
  });

  return {
    publicId: uploaded.public_id,
    url: uploaded.secure_url,
  };
}
