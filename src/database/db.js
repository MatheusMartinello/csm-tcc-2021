const Pool = require("pg").Pool;
//Configuração para conexão com o banco
const pool = new Pool({
  user: "qavneddymlovet",
  password: "937bbc9c8e1f0ada026b5e70cc703d2738fed68b680f8e3de83e7c0229e44139",
  host: "ec2-52-1-20-236.compute-1.amazonaws.com",
  port: "5432",
  database: "d2m0rgibsj0eba",
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
