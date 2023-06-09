import React, { useState, useEffect } from "react";
import SwaggerUI from "swagger-ui-react";
import axios from "axios";
import { generateSwaggerSpec } from "../util";
import "swagger-ui-react/swagger-ui.css";
import "../styles/app.css";

if (!process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY)
  throw new Error(
    "AI Express API key not found. Please set the PAYLOAD_PUBLIC_AIEXPRESS_API_KEY environment variable."
  );

const apiKey = process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY;

const Docs = () => {
  const [prompts, setPrompts] = useState(null);
  const [swaggerSpec, setSwaggerSpec] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data } = await axios.get("/api/prompts");
      if (JSON.stringify(data.docs) !== JSON.stringify(prompts)) {
        setPrompts(data.docs);
        setSwaggerSpec(generateSwaggerSpec(data.docs));
      }
    }
    fetchData();
  }, []);

  if (!prompts) {
    return <></>;
  } else {
    return (
      <SwaggerUI
        displayRequestDuration={true}
        spec={swaggerSpec}
        requestInterceptor={(req) => {
          req.headers["x-api-key"] = apiKey;
          return req;
        }}
      />
    );
  }
};
export default Docs;
