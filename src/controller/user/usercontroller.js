const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");
const user = {
  async createUser({ login, password, name, cpf, rg, bornDate, email }) {
    try {
      password = await bcrypt.hash(password, 10);
      await pool.query(
        "insert into usuario (nome,email,cpf,rg,datanascimento,login,senha) values($1,$2,$3,$4,$5,$6,$7)",
        [name, email, cpf, rg, bornDate, login, password]
      );
    } catch (error) {
      console.log(error);
    }
  },
  async authUser({ login, password }) {
    try {
      const getuser = await pool.query(
        "select idusuario from usuario where login = $1",
        [login]
      );
      const token = jwt.sign(
        { id: getuser.rows[0].idusuario },
        authConfig.secret,
        {
          expiresIn: 86400,
        }
      );
      return token;
    } catch (error) {
      return error;
    }
  },
};

module.exports = user;
