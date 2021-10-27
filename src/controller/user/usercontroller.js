const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");
const returnLatLon = require("../../services/geolocation");
const { CostExplorer } = require("aws-sdk");
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
        "insert into usuario (nome,email,cpf,rg,datanascimento,login,senha,statusdocument) values($1,$2,$3,$4,$5,$6,$7,3)",
        [name, email, cpf, rg, bornDate, login, password]
      );

      const result = await pool.query(
        "SELECT IdUsuario FROM usuario where Login = $1",
        [login]
      );
      const _idUser = result.rows[0].IdUsuario;
      //const getEnderecoInfo = returnLatLon(endereco);
      //await pool.query("INSERT INTO ENDERECO(");
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  async authUser({ login }) {
    try {
      const getuser = await pool.query(
        "select idusuario from usuario where login = $1",
        [login]
      );
      console.log(getuser.rows[0]);
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
      console.error(error);
      return error;
    }
  },
  async registerCar({ idusuario, placa, modelo, marca, renavam }) {
    try {
      await pool.query(
        "INSERT INTO carro(idusuario,placa,modelo,marca,renavam) values ($1,$2,$3,$4,$5)",
        [idusuario, placa, modelo, marca, renavam]
      );

      const result = await pool.query(
        "SELECT idcarro FROM carro where idusuario = $1 and modelo = $2",
        [idusuario, modelo]
      );

      return result.rows[0].idcarro;
    } catch (error) {
      throw ("Não foi possível criar veiculo.", error);
    }
  },
  async getUsersCars({ idusuario }) {
    try {
      const result = await pool.query(
        "SELECT idcarro,placa,modelo,marca from carro where IdUsuario = $1",
        [idusuario]
      );
      console.log(result.rows);
      return result.rows;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async updateUser({
    idusuario,
    name = null,
    cpf = null,
    rg = null,
    password = null,
    email = null,
  }) {
    try {
      const _user = await pool.query(
        "select * from usuario where idusuario = $1",
        [idusuario]
      );
      console.log("Entrouuu");
      if (name == null) name = _user.rows[0].nome;
      if (cpf == null) cpf = _user.rows[0].cpf;
      if (rg == null) rg = _user.rows[0].rg;
      if (email == null) email = _user.rows[0].email;

      if (password != null) password = await bcrypt.hash(password, 10);
      if (password == null) password = _user.rows[0].senha;

      await pool.query(
        "UPDATE USUARIO set nome = $1, cpf = $2, rg = $3, senha = $4, email = $5 where idusuario = $6",
        [name, cpf, rg, password, email, idusuario]
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  async createCar({ idusuario, modelo, marca, cor, placa, renavam }) {
    const checkUser = await pool.query(
      "SELECT 1 From usuario where idusuario = $1",
      [idusuario]
    );
    if (checkUser.rows.length < 1) throw "Usuário não encontrado";

    await pool.query(
      "INSERT INTO Carro(modelo,marca,renavam,placa,idusuario) values ($1,$2,$3,$4,$5)",
      [modelo, marca, cor, renavam, placa, idusuario]
    );
    return true;
  },
  async createCarDoc({ idcarro }, url) {
    try {
      await pool.query(
        "INSERT INTO dadosimagem(urldocumento,tipodocumento,idcarro) values($1,$2,$3)",
        [url, 3, idcarro]
      );
      return;
    } catch (error) {
      throw error;
    }
  },
  async createDoc(idusuario, url) {
    try {
      await pool.query(
        "INSERT INTO dadosimagem(urldocumento,tipodocumento,idusuario) values ($1,$2,$3)",
        [url, 1, idusuario]
      );
      return true;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = user;
