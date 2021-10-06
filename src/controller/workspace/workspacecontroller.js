const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");
const { get } = require("../../routes");

const workspace = {
  async Register({
    name,
    razaosocial,
    password,
    cnpj,
    login,
    email,
    address,
    num,
    cep = null,
    complemento = null,
    latitude = null,
    longitute = null,
    inscricaoEstadual,
  }) {
    try {
      password = await bcrypt.hash(password, 10);

      await pool.query(
        "INSERT INTO oficina(nome,razaosocial,cnpj,login,email,senha,datacriacao,incricaoestadual) values ($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          name,
          razaosocial,
          cnpj,
          login,
          email,
          password,
          new Date(),
          inscricaoEstadual,
        ]
      );
      const idworkspace = await pool.query(
        "SELECT idoficina FROM oficina where Login = $1",
        [login]
      );
      console.log(idworkspace.rows);
      if (idworkspace.rows[0].idoficina === null)
        throw "Não foi possivel criar a oficina";
      // await pool.query(
      //   "INSERT INTO endereco(rua,numero,complemento,cep,latitude,longitude) values($1,$2,$3,$4,$5,$6)",
      //   [address, num, complemento, cep, latitude, longitute]
      // );
      return true;
    } catch (error) {
      console.error(error);
      throw "Não foi possivel criar a oficina" + error;
    }
  },
  async authUser({ login }) {
    try {
      const getuser = await pool.query(
        "select idoficina from oficina where login = $1",
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
  async createDoc(idoficina, url) {
    try {
      await pool.query(
        "INSERT INTO dadosimagem(urldocumento,tipodocumento,idusuario) values ($1,$2,$3)",
        [url, 1, idoficina]
      );
      return true;
    } catch (error) {
      throw error;
    }
  },
  async get(idoficina){
    try {
      const result = pool.query("SELECT ")
    } catch (error) {
      throw error;
    }
  }
};

module.exports = workspace;
