module.exports = {
  dialect: "postgres",
  host: "ec2-34-194-130-103.compute-1.amazonaws.com",
  database: "d234lg3ug9md25",
  user: "nqnsbusptxzsdo",
  port: "5432",
  password: "f04c8274d88f0abf964452593530152a119c131303d8f8a8d00b1a22dc7d7018",
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
