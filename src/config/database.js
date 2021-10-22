module.exports = {
  dialect: "postgres",
  host: process.env.HEROKU_HOST,
  database: process.env.DB,
  user: process.env.USER,
  port: "5432",
  password: process.env.PASSWORD,
  define: {
    timestamp: true,
    underscored: true,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};
