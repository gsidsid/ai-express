const fs = require("fs");
const path = require("path");

let envVars = "";

if (
  !process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY &&
  !process.env.AIEXPRESS_API_KEY
) {
  const envFilePath = path.resolve(__dirname, ".env");
  if (fs.existsSync(envFilePath)) {
    const envFileContent = fs.readFileSync(envFilePath, "utf-8");
    const apiKeyMatch = envFileContent.match(/^AIEXPRESS_API_KEY=(.*)$/m);
    if (apiKeyMatch && apiKeyMatch[1]) {
      envVars += `PAYLOAD_PUBLIC_AIEXPRESS_API_KEY=${apiKeyMatch[1]} `;
      envVars += `AIEXPRESS_API_KEY=${apiKeyMatch[1]} `;
    }
    process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY = apiKeyMatch[1];
    process.env.AIEXPRESS_API_KEY = apiKeyMatch[1];
  }
} else {
  if (process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY) {
    envVars += `AIEXPRESS_API_KEY=${process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY} `;
    process.env.AIEXPRESS_API_KEY =
      process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY;
  }
  if (process.env.AIEXPRESS_API_KEY) {
    envVars += `PAYLOAD_PUBLIC_AIEXPRESS_API_KEY=${process.env.AIEXPRESS_API_KEY} `;
    process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY =
      process.env.AIEXPRESS_API_KEY;
  }
}

if (process.env.EXTERNAL_HOSTNAME) {
  envVars += `PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME=${process.env.EXTERNAL_HOSTNAME} `;
  process.env.PAYLOAD_PUBLIC_EXTERNAL_HOSTNAME = process.env.EXTERNAL_HOSTNAME;
}

if (process.env.MONGODB_URI) {
  envVars += `PAYLOAD_PUBLIC_MONGODB_URI=${process.env.MONGODB_URI} `;
  process.env.PAYLOAD_PUBLIC_MONGODB_URI = process.env.MONGODB_URI;
}

console.log(envVars.trim());
