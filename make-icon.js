import { Jimp } from "jimp";
import path from "path";

async function createIcon() {
  try {
    const logoPath = path.resolve("./assets/images/barani-logo.png");
    const outPath = path.resolve("./assets/images/app-icon.png");

    console.log("Loading logo:", logoPath);
    const logo = await Jimp.read(logoPath);

    // Create a 1024x1024 white image
    const icon = new Jimp({ width: 1024, height: 1024, color: 0xffffffff });

    // Calculate scaling to make logo fit within 700x700 center area
    const scale = Math.min(700 / logo.width, 700 / logo.height);
    
    // Scale logo
    logo.resize({ w: logo.width * scale, h: logo.height * scale });

    // Composite logo in the center
    const x = (1024 - logo.width) / 2;
    const y = (1024 - logo.height) / 2;
    
    icon.composite(logo, x, y);

    await icon.write(outPath);
    console.log("Created professional padded icon at:", outPath);
  } catch (err) {
    console.error("Error generating icon:", err);
  }
}

createIcon();
