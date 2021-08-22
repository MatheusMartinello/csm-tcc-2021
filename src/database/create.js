const pool = require("./db");

const db = {
  async inicializadorBD() {
    try {
      // await pool.query(
      //   'CREATE TABLE "Usuario"' +
      //     +"(" +
      //     +"IdUsuario      serial NOT NULL," +
      //     +"Nome           varchar(50) NOT NULL," +
      //     +"Email          varchar(50) NOT NULL," +
      //     +"CPF            numeric NOT NULL," +
      //     +"RG             numeric NOT NULL," +
      //     +"DataNascimento date NOT NULL," +
      //     +"Senha          varchar(50) NOT NULL," +
      //     +"Login          varchar(250) NOT NULL," +
      //     +"CONSTRAINT PK_usuario PRIMARY KEY ( IdUsuario )" +
      //     +");"
      // );
      const test = await pool.query("SELECT NOW()");
    } catch (err) {
      console.log(err);
    }
  },
  async criaBanco() {
    //Cria tabela Usuario
  },
};
module.exports = db;
