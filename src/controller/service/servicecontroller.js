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
    nomecliente,
    contatocliente,
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
        nomecliente,
        email,
        contatocliente
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
      let valorTotal = 0;
      for (const element of pecas) {
        const { idpeca, qnt } = element;
        const peca = await pool.query(
          "Select * from pecas where idpeca = $1 ",
          [idpeca]
        );
        await pool.query(
          "insert into descricaoservico (idordemdeservico,idpeca,quantidade, valor) values($1,$2,$3,$4)",
          [
            idOS.rows[0].idordemdeservico,
            idpeca,
            qnt,
            Number(peca.rows[0].valorunitario) * Number(qnt),
          ]
        );
        valorTotal += Number(peca.rows[0].valorunitario) * Number(qnt);
        console.log("Peça!");
        console.log(element);
        console.log("Valor total: " + valorTotal);
        await pool.query(
          "update estoque set quantidade = quantidade - $1 where idpeca = $2 and idoficina = $3",
          [qnt, idpeca, idoficina]
        );
      }
      for (const element of maoobra) {
        const { responsavel, valor, qnthoras, descricao } = element;
        await pool.query(
          "insert into maodeobra (responsavel,valor,qnthoras,idordemdeservico,descricao) values($1,$2,$3,$4,$5)",
          [
            responsavel,
            valor * qnthoras,
            qnthoras,
            idOS.rows[0].idordemdeservico,
            descricao,
          ]
        );
        valorTotal += Number(valor) * qnthoras;
        console.log("Mão obra");
        console.log(element);
        console.log("Valor total: " + valorTotal);
      }

      await pool.query(
        "update ordemdeservico set valortotal = $1 where idordemdeservico = $2 ",
        [valorTotal, idOS.rows[0].idordemdeservico]
      );
      await pool.query("commit");
      return true;
    } catch (error) {
      await pool.query("rollback");
      console.error(error);
      return false;
    }
  },
  async newWorkspaceUser(idoficina, nomecliente, email, contatocliente) {
    const userWorkspace = await pool.query(
      "insert into usuariooficina (nome,email,contatousuario,idoficina) values($1,$2,$3,$4) returning * ",
      [nomecliente, email, contatocliente, idoficina]
    );

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
      "select o.idordemdeservico, o.idoficina , o.idcarro , o.idusuario , o.idusuarioanonimo, o.status , to_char(o.createat, 'DD/MM/YYYY') as createat, o.descricao, o.car_km ,c.modelo,c.marca,c.placa, coalesce(o.valortotal,0) as maodeobra from ordemdeservico o inner join carro c on c.idcarro = o.idcarro left join maodeobra m on m.idordemdeservico = o.idordemdeservico where idoficina = $1 " +
      "group by o.idordemdeservico,c.modelo,c.marca, c.placa " +
      "order by createat, o.idordemdeservico desc";
    try {
      const result = await pool.query(query, [idoficina]);
      console.log(result.rows[0].createat);
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
      "select o.idordemdeservico, o.idoficina , o.idcarro , o.idusuario , o.idusuarioanonimo, o.status , to_char(o.createat, 'DD/MM/YYYY') as createat, o.descricao, o.car_km ," +
      "c.modelo," +
      "c.marca," +
      "c.placa," +
      "o.car_km," +
      "case when u.nome is null " +
      "          then u2.nome " +
      "          else u.nome " +
      "          end as nomecliente," +
      "case when t.telefonecompleto is null" +
      "          then u2.contatousuario " +
      "          else t.telefonecompleto " +
      "          end as contatoclinte ," +
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
  async UpdateService({
    pecas,
    maoobra,
    idordemdeservico,
    status,
    descricao,
    car_km,
    idoficina,
  }) {
    try {
      let valorTotal = 0;
      await pool.query("begin");
      console.log(idordemdeservico);
      console.log(pecas);
      if (pecas != null || pecas != undefined) {
        const queryP =
          "update pecas set valorunitario = $1, nome = $2 where idpeca =$3";
        const queryD =
          "update descricaoservico set quantidade = $1,valor = $2 where idpeca = $3";
        const queryAddPeca =
          "insert into pecas (nome,valorunitario) values ($1,$2) returning *"; // adicionar peças sem idpeça
        const queryRemoveStock =
          "update estoque set quantidade = quantidade - $1 where idoficina = $2 and idpeca = $3";
        for (const element of pecas) {
          const { nome, valorunitario, quantidade, idpeca } = element;
          console.log(element);
          if (idpeca == null) {
            const peca = await pool.query(queryAddPeca, [nome, valorunitario]);
            await pool.query(
              "insert into descricaoservico (idordemdeservico,idpeca,quantidade, valor) values($1,$2,$3,$4)",
              [
                idordemdeservico,
                peca.rows[0].idpeca,
                quantidade,
                valorunitario * quantidade,
              ]
            );
            await pool.query(queryRemoveStock, [quantidade, idoficina, idpeca]);
          } else {
            //await pool.query(queryP, [valorunitario, nome, idpeca]);
            await pool.query(queryD, [
              quantidade,
              valorunitario * quantidade,
              idpeca,
            ]);
            valorTotal += valorunitario * quantidade;
            await pool.query(queryRemoveStock, [quantidade, idoficina, idpeca]);
          }
          const descOs = await pool.query(
            "select idpeca from descricaoservico where idordemdeservico = $1",
            [idordemdeservico]
          );
          if (!descOs.rows.some((item) => item === idpeca)) {
            console.log("Adicionou a peça na os");
            await pool.query(
              "insert into descricaoservico (idordemdeservico,idpeca,quantidade, valor) values($1,$2,$3,$4)",
              [
                idordemdeservico,
                peca.rows[0].idpeca,
                quantidade,
                valorunitario * quantidade,
              ]
            );
          }
          console.log("Valor total: " + valorTotal);
          console.log("Peças:");
          console.log(element);
        }
      }
      if (status != null) {
        const query =
          "update ordemdeservico set status = $1, car_km= $2 where idordemdeservico = $3";
        await pool.query(query, [status, car_km, idordemdeservico]);
      }
      if (descricao != null) {
        const query =
          "update ordemdeservico set descricao = $1 where idordemdeservico = $2";
        await pool.query(query, [descricao, idordemdeservico]);
      }
      if (maoobra != null) {
        const query =
          "update maodeobra set valor = $1, responsavel = $2, qnthoras = $3, descricao = $4 where idmaodeobra = $5 and idordemdeservico = $6";
        for (const element of maoobra) {
          const {
            responsavel,
            valor,
            qnthoras = null,
            idmaodeobra = null,
            descricao,
          } = element;
          if (idmaodeobra == null) {
            await pool.query(
              "insert into maodeobra (responsavel,valor,qnthoras,idordemdeservico,descricao) values($1,$2,$3,$4,$5)",
              [responsavel, valor, qnthoras, idordemdeservico, descricao]
            );
          } else {
            await pool.query(query, [
              valor,
              responsavel,
              qnthoras,
              descricao,
              idmaodeobra,
              idordemdeservico,
            ]);
          }

          valorTotal += valor * qnthoras;
          console.log("Valor total: " + valorTotal);
          console.log("Mao obra:");
          console.log(element);
        }
      }
      await pool.query(
        "update ordemdeservico set valortotal = $1 where idordemdeservico = $2",
        [valorTotal, idordemdeservico]
      );
      await pool.query("end");
      return true;
    } catch (error) {
      console.log(error);
      await pool.query("rollback");
      throw error;
    }
  },
  async addPart({ idoficina, nome, quantidade, valor }) {
    try {
      await pool.query("begin");
      console.log(nome);
      console.log(valor);
      const queryAddPart =
        "insert into pecas (nome,valorunitario) values ($1,$2) returning * ";
      const resultQuery = await pool.query(queryAddPart, [nome, valor]);

      const queryAddStock =
        "insert into estoque (idpeca,idoficina,quantidade) values ($1,$2,$3)";
      await pool.query(queryAddStock, [
        resultQuery.rows[0].idpeca,
        idoficina,
        quantidade,
      ]);
      await pool.query("end");

      return;
    } catch (error) {
      console.log(error);
      await pool.query("rollback");
      throw error;
    }
  },
  async getListStock({ idoficina, nome, quantidade, valor }) {
    const query =
      "select p.*,o.idoficina,e.quantidade " +
      "from estoque e " +
      "left join pecas p on e.idpeca = p.idpeca " +
      "left join oficina o on e.idoficina = o.idoficina " +
      "where o.idoficina = $1";
    const result = await pool.query(query, [idoficina]);
    return result.rows;
  },
  async updatePart({ idoficina, nome, quantidade, valor, idpeca }) {
    try {
      const queryUpdatePecas =
        "update pecas set nome = $1, valorunitario = $2 where idpeca = $3";
      const queryUpdateStock =
        "update estoque set quantidade = $1 where idoficina = $2 and idpeca = $3";
      await pool.query("begin");
      await pool.query(queryUpdatePecas, [nome, valor, idpeca]);
      await pool.query(queryUpdateStock, [quantidade, idoficina, idpeca]);
      await pool.query("end");
    } catch (error) {
      console.log(error);
      await pool.query("rollback");
      throw error;
    }
  },
  async getPartsNew({ idoficina, idpeca }) {
    const queryPecas =
      "select p.*,o.idoficina,e.quantidade " +
      " from estoque e " +
      " left join pecas p on e.idpeca = p.idpeca " +
      " left join oficina o on e.idoficina = o.idoficina " +
      " where o.idoficina = $1 and p.idpeca = $2";
    console.log(idoficina);
    console.log(idpeca);
    const result = await pool.query(queryPecas, [idoficina, idpeca]);

    return result.rows[0];
  },
};

module.exports = service;
