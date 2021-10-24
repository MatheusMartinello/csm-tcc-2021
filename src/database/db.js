const Pool = require("pg").Pool;
const database = require("../config/database");
//Configuração para conexão com o banco
const pool = new Pool(database);

module.exports = pool;
