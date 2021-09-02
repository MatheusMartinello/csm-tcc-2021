const express = require("express");
const app = express();
const routes = require("./routes");
const cors = require("cors");
//Routes
app.use(express.json());
app.use(routes);
app.use(cors);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server open in port 3000!");
});
