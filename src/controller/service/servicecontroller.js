const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");
const returnLatLon = require("../../services/geolocation");
const { CostExplorer } = require("aws-sdk");

const service = {
  async newServicePost({
    idoficina,
    status,
    descricao,
    nomeCliente,
    contatoCliente,
    modelo,
    marca,
    placa,
    cor,
    email,
    km,
    pecas,
    maoobra,
  }) {
    try {
      await pool.query("begin");
      //check if the idoficina exists
      const result = await pool.query(
        "SELECT 1 FROM oficina where idoficina = $1",
        [idoficina]
      );

      if (result.rows[0] == "" || result.rows[0] == null) {
        throw "Oficina não localizada!";
      }
      const iduserworkspace = await this.newWorkspaceUser(
        idoficina,
        nomeCliente,
        email,
        contatoCliente
      );
      const idcaruserworkspace = await this.newCarUserWorkSpace(
        iduserworkspace,
        modelo,
        marca,
        cor,
        placa
      );
      const idOS = await pool.query(
        "insert into ordemdeservico (idoficina,idcarro,idusuarioanonimo,status) values($1,$2,$3,$4) returning *",
        [idoficina, idcaruserworkspace, iduserworkspace, status]
      );

      for (const element of pecas) {
        const { nome, valor, qnt } = element;
        const idpeca = await pool.query(
          "insert into pecas (nome,valorunitario) values ($1,$2) returning *",
          [nome, valor]
        );
        await pool.query(
          "insert into descricaoservico (idordemdeservico,idpeca,quantidade, valor) values($1,$2,$3,$4)",
          [
            idOS.rows[0].idordemdeservico,
            idpeca.rows[0].idpeca,
            qnt,
            valor * qnt,
          ]
        );
      }
      for (const element of maoobra) {
        const { responsavel, valor, qnthoras = null } = element;
        await pool.query(
          "insert into maodeobra (responsavel,valor,qnthoras,idordemdeservico) values($1,$2,$3,$4)",
          [responsavel, valor, qnthoras, idOS.rows[0].idordemdeservico]
        );
      }
      await pool.query("commit");
      return true;
    } catch (error) {
      await pool.query("rollback");
      console.error(error);
    }
  },
  async newWorkspaceUser(idoficina, nomeCliente, email, contatoCliente) {
    await pool.query(
      "insert into usuariooficina (nome,email,contatousuario,idoficina) values($1,$2,$3,$4)",
      [nomeCliente, email, contatoCliente, idoficina]
    );
    const userWorkspace = await pool.query(
      "select idusuariooficina from usuariooficina where nome = $1",
      [nomeCliente]
    );
    console.log(userWorkspace.rows[0]);
    return userWorkspace.rows[0].idusuariooficina;
  },
  async newCarUserWorkSpace(idusuariooficina, modelo, marca, cor, placa) {
    try {
      await pool.query(
        "insert into carro (idusuariooficina,modelo,marca,cor, placa) values($1,$2,$3,$4,$5)",
        [idusuariooficina, modelo, marca, cor, placa]
      );
      const car = await pool.query(
        "select idcarro from carro where idusuariooficina=$1 and placa=$2",
        [idusuariooficina, placa]
      );

      return car.rows[0].idcarro;
    } catch (error) {
      console.error(error);
    }
  },
};

module.exports = service;
