const express = require("express");
const app = express();
const routes = require("./routes");
//Routes
app.use(express.json());
app.use(routes);

app.listen(3000, () => {
  console.log("Server open in port 3000!");
});
