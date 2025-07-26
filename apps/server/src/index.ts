import fs from 'fs';
import os from 'os';
import path from 'path';

const directoriesToTest = [
  process.cwd(), // The one that's likely failing
  os.tmpdir(),   // Usually writable, but often temporary
  os.homedir(),  // The user's home directory
  '/data',       // A common convention for persistent data
  '/var/data'    // Another common convention
];

console.log("🕵️  Checking for writable directories...");
for (const dir of directoriesToTest) {
  try {
    // Ensure directory exists for the test
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const testPath = path.join(dir, '.writetest');
    fs.writeFileSync(testPath, 'test');
    fs.unlinkSync(testPath);
    console.log(`✅ SUCCESS: "${dir}" is writable.`);
  } catch (e) {
    const error = e as Error;
    console.log(`❌ FAILED: "${dir}" is NOT writable. Error: ${error.message}`);
  }
}

/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting (without Colyseus Cloud), you can manually
 * instantiate a Colyseus Server as documented here:
 *
 * See: https://docs.colyseus.io/server/api/#constructor-options
 */

// Load environment variables
import "dotenv/config";

import { listen } from "@colyseus/tools";

// Import app configuration
import app from "./app.config";

// Start listening
listen(app);