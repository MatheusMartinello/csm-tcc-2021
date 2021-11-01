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
        "insert into ordemdeservico (idoficina,idcarro,idusuarioanonimo,status,descricao,car_km) values($1,$2,$3,$4,$5,$6) returning *",
        [idoficina, idcaruserworkspace, iduserworkspace, status, descricao, km]
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
      return false;
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
      const car = await pool.query("select idcarro from carro where placa=$1", [
        placa.toUpperCase(),
      ]);
      console.log(car);
      if (car.rows[0] == null) {
        console.log("Entrou");
        const result = await pool.query(
          "insert into carro (idusuariooficina,modelo,marca,cor, placa) values($1,$2,$3,$4,$5) returning *",
          [idusuariooficina, modelo, marca, cor, placa.toUpperCase()]
        );
        return result.rows[0].idcarro;
      }
      if (car.rows[0] != null)
        await pool.query(
          "Update carro set idusuariooficina = $1 where idcarro =$2",
          [idusuariooficina, car.rows[0].idcarro]
        );

      return car.rows[0].idcarro;
    } catch (error) {
      console.error(error);
      throw "Erro no cadastro carro";
    }
  },
  async getListServices({ idoficina }) {
    const query =
      "select o.*,c.modelo,c.marca,c.placa, sum(coalesce (m.valor,0)) as maodeobra from ordemdeservico o inner join carro c on c.idcarro = o.idcarro left join maodeobra m on m.idordemdeservico = o.idordemdeservico where idoficina = $1 " +
      "group by o.idordemdeservico,c.modelo,c.marca, c.placa " +
      "order by createat, o.idordemdeservico desc";
    try {
      const result = await pool.query(query, [idoficina]);
      return result.rows;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  async getService({ idordemdeservico }) {
    const parts = await this.getParts(idordemdeservico);
    const mo = await this.getMO(idordemdeservico);

    const query =
      "select o.*," +
      "c.modelo," +
      "c.marca," +
      "c.placa," +
      "o.car_km," +
      "case when u.nome is null " +
      "          then u2.nome " +
      "          else u.nome " +
      "          end as nome," +
      "case when t.telefonecompleto is null" +
      "          then u2.contatousuario " +
      "          else t.telefonecompleto " +
      "          end as contatoCliente ," +
      "case when u.email is null " +
      "          then u2.email " +
      "          else u.email " +
      "          end as email " +
      "from ordemdeservico o " +
      "inner join carro c on c.idcarro = o.idcarro " +
      "left join usuario u on u.idusuario = o.idusuario " +
      "left join telefone t on t.idusuario = u.idusuario " +
      "left join usuariooficina u2 on u2.idusuariooficina = o.idusuarioanonimo " +
      "where idordemdeservico = $1";

    const result = await pool.query(query, [idordemdeservico]);

    const objResult = {
      os: result.rows[0],
      pecas: parts,
      maoobra: mo,
    };

    return objResult;
  },
  async getParts(idordemdeservico) {
    const query =
      "select p.nome ,d.quantidade , p.valorunitario, p.idpeca" +
      " from ordemdeservico o " +
      "inner join descricaoservico d " +
      "on o.idordemdeservico = d.idordemdeservico " +
      "left join pecas p " +
      "on p.idpeca = d.idpeca " +
      "where o.idordemdeservico = $1";
    const result = await pool.query(query, [idordemdeservico]);
    return result.rows;
  },
  async getMO(idordemdeservico) {
    const query =
      "select m.* from ordemdeservico o inner join maodeobra m on o.idordemdeservico = m.idordemdeservico where o.idordemdeservico = $1";
    const result = await pool.query(query, [idordemdeservico]);
    return result.rows;
  },
  async UpdateService({ pecas, maoobra, idordemdeservico }) {
    try {
      await pool.query("begin");
      console.log(pecas);
      if (pecas != null || pecas != undefined) {
        const queryP =
          "update pecas set valorunitario = $1, nome = $2 where idpeca =$3";
        const queryD =
          "update descricaoservico set quantidade = $1,valor = $2 where idpeca = $3";
        for (const element of pecas) {
          const { nome, valorunitario, quantidade, idpeca } = element;
          console.log(element);
          await pool.query(queryP, [valorunitario, nome, idpeca]);
          await pool.query(queryD, [
            quantidade,
            valorunitario * quantidade,
            idpeca,
          ]);
        }
      }
      if (maoobra != null || maoobra != undefined) {
        const query =
          "update maodeobra set valor = $1, responsavel = $2, qnthoras = $3 where idmaodeobra = $4 and idordemdeservico = $5";
        for (const element of maoobra) {
          const { responsavel, valor, qnthoras = null, idmaodeobra } = element;
          await pool.query(query, [
            valor,
            responsavel,
            qnthoras,
            idmaodeobra,
            idordemdeservico,
          ]);
        }
      }
      return true;
    } catch (error) {
      console.log(error);
      await pool.query("rollback");
      throw error;
    }
  },
};

module.exports = service;
