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

console.log(envVars.trim());
