import React, { useState } from "react";
import { lazy, Suspense } from "react";

if (!process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY)
  throw new Error(
    "AI Express API key not found. Please set the PAYLOAD_PUBLIC_AIEXPRESS_API_KEY environment variable."
  );

var Docs;

const ApiDocs = () => {
  const [copied, setCopied] = useState(false);
  const apiKey = process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY;

  Docs = Docs || lazy(() => import("./Swagger.js"));

  const copyToClipboard = (e) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(apiKey);
    } else {
      // http fallback
      const textArea = document.createElement("textarea");
      textArea.value = apiKey;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Unable to copy to clipboard", err);
      }
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <>
      <header>
        <h2 style={{ marginTop: "1rem", marginBottom: "0.25rem" }}>Your API</h2>
        <p>
          {apiKey
            ? "All requests to prompt-based endpoints must include an x-api-key header matching your AIEXPRESS_API_KEY environment variable (copy below)."
            : "AIEXPRESS_API_KEY is not set as an environment variable. Anyone can access your API."}
        </p>
        <button
          style={{ marginTop: "0rem", marginBottom: "2.5rem" }}
          className={
            "btn btn--style-primary btn--icon-style-without-border btn--size-small btn--icon-position-right " +
            (!apiKey || copied ? "btn--disabled" : "")
          }
          id="action-copy-key"
          name="key"
          onClick={copyToClipboard}
        >
          {copied ? "Copied!" : "Copy API Key"}
        </button>
      </header>
      <div style={{ marginLeft: "-1.5rem" }}>
        <Suspense fallback={<></>}>
          <Docs />
        </Suspense>
      </div>
    </>
  );
};

export default ApiDocs;
