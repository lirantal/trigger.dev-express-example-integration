const dotenv = require("dotenv");
const express = require("express");
const { TriggerClient, eventTrigger } = require("@trigger.dev/sdk");
const { OpenAI } = require("@trigger.dev/openai");

let titleGeneratedText = null;

dotenv.config();
const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Instantiate the Trigger.dev client
const client = new TriggerClient({
  id: "trigger-express-example-vanilla",
  apiKey: process.env.TRIGGER_API_KEY,
});

// Instantiate the OpenAI integration for Trigger.dev
const openai = new OpenAI({
  id: "openai",
  apiKey: process.env.OPENAI_API_KEY,
});

// Defines a new background job
client.defineJob({
  // 1. Job Metadata
  id: "express-title-generator",
  name: "Express Title Generator",
  version: "1.0.0",
  // 2. Trigger is defined as a custom code-triggered event
  trigger: eventTrigger({
    name: "title.generate",
  }),
  integrations: {
    openai,
  },
  // 3. The Run function which is called when the job is triggered
  run: async (payload, io) => {
    // This simple run just logs the payload and returns it
    const result = await io.openai.backgroundCreateChatCompletion(
      "Generating summary",
      {
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "user",
            content: `The following is a description of a presentation, often submitted to call for papers to speak at events. Only reply with a title that would best fit this description: ${payload.talkDescriptionText}`,
          },
        ],
      }
    );

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      io.logger.error("Failed to process OpenAI request");
      return;
    }

    const title = result.choices[0].message.content;
    titleGeneratedText = title;

    return { titleGeneratedText };
  },
});

// Defines the /api/trigger endpoint which Trigger.dev
// requires to be able to interact and exchange job data
// with this Node.js server, such as:
// 1. Register jobs that we defined above with client.defineJob()
// 2. Trigger jobs when a new event is received
app.post("/api/trigger", async (req, res, next) => {
  if (req.method === "HEAD") {
    return res.sendStatus(200);
  }

  try {
    // Prepare the request to be a fetch-compatible Request object:
    const requestHeaders = req.headers;
    const requestMethod = req.method;
    const responseHeaders = Object.create(null);

    for (const [headerName, headerValue] of Object.entries(requestHeaders)) {
      responseHeaders[headerName] = headerValue;
    }

    // Create a new Request object to be passed to the TriggerClient
    // where we pass the clone the incoming request metadata such as
    // headers, method, body.
    const request = new Request("https://express.js/api/trigger", {
      headers: responseHeaders,
      method: requestMethod,
      body: req.body ? JSON.stringify(req.body) : req,
      duplex: "half",
    });

    // This handshake handler knows how to authenticate requests,
    // call the run() function of the job, and so on
    const response = await client.handleRequest(request);

    if (!response) {
      return res.status(404).json({ error: "Not found" });
    }

    // Optionally can do something with the job's finished
    // execution's response body
    return res.status(response.status).json(response.body);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/titles", async (req, res, next) => {
  return res.json({ title: titleGeneratedText });
});

app.post("/api/titles", async (req, res, next) => {
  await client.sendEvent({
    name: "title.generate",
    payload: { talkDescriptionText: req.body.talkDescriptionText },
  });

  return res.json({ message: "new job added to queue" });
});

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
