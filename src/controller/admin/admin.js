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
  async getDocument({ idusuario }) {
    try {
      const result = await pool.query(
        "select d.urldocumento  from usuario u inner join dadosimagem d on u.idusuario = d.idusuario where u.aprovado = false and d.tipodocumento = 1 and u.idusuario = $1",
        [idusuario]
      );
      console.log(result);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  async GetAllCarsToApprove() {
    try {
      const result = await pool.query(
        "select c.*,u.login from carro c left join usuario u on u.idusuario = c.idusuario where c.aprovado =false "
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  async GetDocumentCar({ idusuario, idcarro }) {
    try {
      const result = await pool.query(
        "SELECT urldocumento,idcarro,idusuario from dadosimagem where idusuario = $1 and idcarro = $2 and idtipo = 3",
        [idusuario, idcarro]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = admin;
