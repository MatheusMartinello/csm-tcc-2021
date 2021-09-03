const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");

const admin = {
  async Register({ login, password }) {
    try {
      password = await bcrypt.hash(password, 15);
      await pool.query(
        "INSERT INTO usuariosadmin(login,senha) values ($1,$2)",
        [login, password]
      );
      return true;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  async authUser({ login }) {
    try {
      const getuser = await pool.query(
        "select idusuarioadmin from usuariosadmin where login = $1",
        [login]
      );
      if (getuser.rows[0] == null) return "error";
      const token = jwt.sign(
        { id: getuser.rows[0].idoficina },
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
  async getUsersAprove() {
    try {
      const result = await pool.query(
        "select idusuario,nome,email,cpf,rg,datanascimento,login from usuario u where u.aprovado = false"
      );
      return result.rows;
    } catch (error) {
      console.error(error);
    }
  },
  async getTotalAprove() {
    try {
      const userResult = await pool.query(
        "SELECT COUNT(*) from usuario u where u.Aprovado = false"
      );
      const workspaceResult = await pool.query(
        "SELECT COUNT(*) from oficinas o where o.Aprovado = false"
      );
      return (userResult.rows[0] ?? 0) + (workspaceResult.rows[0] ?? 0);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};

module.exports = admin;
