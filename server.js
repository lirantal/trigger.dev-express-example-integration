const dotenv = require("dotenv");
const express = require("express");

dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});