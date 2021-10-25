const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");
const returnLatLon = require("../../services/geolocation");
const { CostExplorer } = require("aws-sdk");

const service = {
  async newService({
    idoficina,
    status,
    descricao,
    idusuario = null,
    nomeCliente,
    contatoCliente,
    idcarro = null,
    modelo,
    marca,
    placa,
    cor,
    km,
  }) {
    //check if the idoficina exists
    const result = await pool.query(
      "SELECT 1 FROM oficina where idoficina = $1",
      [idoficina]
    );
    if (result.rows[0] == "" || result.rows[0] == null) {
      throw "Oficina não localizada!";
    }
    if (idusuario != null) {
      const user = await pool.query(
        "select 1 from usuario where idusuario = $1",
        [idusuario]
      );
      if (user.rows[0] == "" || user.rows[0] == null)
        throw "Usuario informado não localizado";
    }
    if (idcarro != null) {
      const car = await pool.query("select 1 from carro where idcarro =$1", [
        idcarro,
      ]);
      if (car.rows[0] == "" || car.rows[0] == null)
        throw "Carro informado não localizado";
    }
  },
};

module.exports = service;
