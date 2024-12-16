import * as path from 'path'; // Ensures compatibility in CommonJS environments
import fetch from 'node-fetch';
import sharp from 'sharp';
import fs from 'fs-extra';

const IMAGE_DIR = path.join(__dirname, 'public', 'images');
console.log('Resolved IMAGE_DIR:', IMAGE_DIR);

// Ensure the image directory exists
fs.ensureDirSync(IMAGE_DIR);

export const downloadAndResizeImage = async (
  type: 'podcast' | 'episode',
  identifier: string,
  imageUrl: string,
  width: number = 800,
  height: number = 800
): Promise<string | null> => {
  try {
    if (!imageUrl) return null;

    new URL(imageUrl); // Validate URL

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to download image: ${response.statusText}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const resizedImageBuffer = await sharp(buffer)
      .resize(width, height, { fit: 'inside' })
      .toFormat('jpeg')
      .jpeg({ quality: 80 })
      .toBuffer();

    const filename = `${type}_${identifier}.jpg`;
    const localImagePath = path.join(IMAGE_DIR, filename);
    await fs.writeFile(localImagePath, resizedImageBuffer);

    return `/images/${filename}`;
  } catch (error) {
    console.error(`Error processing image ${imageUrl}:`, error);
    return null;
  }
};

export const deleteLocalImage = async (type: 'podcast' | 'episode', identifier: string): Promise<void> => {
  try {
    const filename = `${type}_${identifier}.jpg`;
    const fullPath = path.join(IMAGE_DIR, filename);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      console.log(`Deleted image at ${fullPath}`);
    }
  } catch (error) {
    console.error(`Error deleting image for ${type} ID ${identifier}:`, error);
  }
};
