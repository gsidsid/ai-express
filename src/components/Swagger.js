import React, { useState, useEffect } from "react";
import SwaggerUI from "swagger-ui-react";
import axios from "axios";
import { generateSwaggerSpec } from "../util";
import "swagger-ui-react/swagger-ui.css";
import "../styles/app.css";

const Docs = () => {
  const [prompts, setPrompts] = useState(null);
  useEffect(() => {
    async function fetchData() {
      const { data } = await axios.get("/api/prompts");
      setPrompts(data.docs);
    }
    fetchData();
  }, []);

  if (!prompts) {
    return <></>;
  } else {
    return (
      <SwaggerUI
        displayRequestDuration={true}
        spec={generateSwaggerSpec(prompts)}
        requestInterceptor={(req) => {
          req.headers["x-api-key"] =
            process.env.PAYLOAD_PUBLIC_AIEXPRESS_API_KEY;
          return req;
        }}
      />
    );
  }
};
export default Docs;
