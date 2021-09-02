const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");
const returnLatLon = require("../../services/geolocation");
const user = {
  async createUser({
    login,
    password,
    name,
    cpf,
    rg,
    bornDate,
    email,
    endereco,
    numero,
  }) {
    try {
      password = await bcrypt.hash(password, 10);
      await pool.query(
        "insert into usuario (nome,email,cpf,rg,datanascimento,login,senha) values($1,$2,$3,$4,$5,$6,$7)",
        [name, email, cpf, rg, bornDate, login, password]
      );

      const result = await pool.query(
        "SELECT IdUsuario FROM usuario where Login = $1",
        [login]
      );
      const _idUser = result.rows[0].IdUsuario;
      const getEnderecoInfo = returnLatLon(endereco);
      //await pool.query("INSERT INTO ENDERECO(");
    } catch (error) {
      console.log(error);
    }
  },
  async authUser({ login }) {
    try {
      const getuser = await pool.query(
        "select idusuario from usuario where login = $1",
        [login]
      );
      if (getuser.rows[0] == null) return "error";
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
  async registerCar({ idusuario, placa, modelo, marca, renavam }) {
    try {
      await pool.query(
        "INSERT INTO carro(idusuario,placa,modelo,marca,renavam) values ($1,$2,$3,$4,$5)",
        [idusuario, placa, modelo, marca, renavam]
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  async getUsersCars({ idusuario }) {
    try {
      const result = await pool.query(
        "SELECT placa,modelo,marca from carro where IdUsuario = $1",
        [idusuario]
      );
      return result.rows;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async updateUser({ idusuario, name, cpf, rg }) {
    await pool.query("UPDATE USUARIO")
  },
};

module.exports = user;
