const express = require("express");
const app = express();
const routes = require("./routes");
const cors = require("cors");
require("dotenv").config();
//Routes`
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(routes);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server open in port 3000!");
  console.log(process.env);
});
