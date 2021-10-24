require("dotenv").config();
module.exports = {
  host: process.env.HEROKU_HOST,
  database: process.env.HEROKU_DB,
  user: process.env.HEROKU_USER,
  port: "5432",
  password: process.env.HEROKU_PASSWORD,
  ssl: { rejectUnauthorized: false },
};
