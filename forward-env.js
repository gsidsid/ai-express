const fs = require("fs");
const path = require("path");

const envFilePath = path.resolve(__dirname, ".env");

let envVars = "";

if (fs.existsSync(envFilePath)) {
  const envFileContent = fs.readFileSync(envFilePath, "utf-8");
  const apiKeyMatch = envFileContent.match(/^AIEXPRESS_API_KEY=(.*)$/m);

  if (apiKeyMatch && apiKeyMatch[1]) {
    envVars += `PAYLOAD_PUBLIC_AIEXPRESS_API_KEY=${apiKeyMatch[1]} `;
  }
}

console.log(envVars.trim());
