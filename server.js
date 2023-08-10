const dotenv = require("dotenv");
const express = require("express");
const { TriggerClient, eventTrigger } = require("@trigger.dev/sdk");

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
  // 3. The Run function which is called when the job is triggered
  run: async (payload, io) => {
    // This simple run just logs the payload and returns it
    await io.logger.info("Hello world!", { payload });
    return payload;
  },
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
