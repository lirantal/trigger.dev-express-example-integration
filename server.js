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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
