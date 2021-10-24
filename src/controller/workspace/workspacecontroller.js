const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");

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
        "INSERT INTO oficina(nome,razaosocial,cnpj,login,email,senha,datacriacao,inscricaoestadual) values ($1,$2,$3,$4,$5,$6,$7,$8)",
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
  async get({ idoficina }) {
    try {
      console.log(idoficina);
      const result = pool.query(
        "SELECT nome,email,inscricaoestadual from oficina where idoficina = $1",
        [idoficina]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  async update({
    name = null,
    cnpj = null,
    inscricaoEstadual = null,
    cep = null,
    lograduro = null,
    numero = null,
    bairro = null,
    email = null,
    senha = null,
    idoficina,
  }) {
    try {
      const workspace = await pool.query(
        "select * from oficina o where o.idoficina = $1",
        [idoficina]
      );
      if (name === null) {
        name = workspace.rows[0].nome;
      }
      if (cnpj === null) {
        cnpj = workspace.rows[0].cnpj;
      }
      if (inscricaoEstadual === null) {
        inscricaoEstadual = workspace.rows[0].inscricaoestadual;
      }
      if (email === null) {
        email = workspace.rows[0].email;
      }
      if (password != null) {
        password = bcrypt.hash(password, 10);
      }
      if (password === null) {
        password = workspace.rows[0].password;
      }
      await pool.query(
        "update oficina set nome = $1,inscricaoestadual =$2,cnpj =$3,email =$4,senha =$5 where idoficina = $6",
        [name, inscricaoEstadual, cnpj, email, senha, idoficina]
      );
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};

module.exports = workspace;
