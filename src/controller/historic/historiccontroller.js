const pool = require("../../database/db");
const historic = {
  async GetListHistoric({ placa }) {
    const query =
      "select o.idordemdeservico, o.descricao, c.idcarro ,c.modelo, c.placa, c.marca, o.car_km,o.createat from ordemdeservico o " +
      "left join descricaoservico d on d.idordemdeservico = o.idordemdeservico " +
      "left join carro c on c.idcarro = o.idcarro " +
      `where c.placa like $1 ` +
      "group by o.idordemdeservico, c.idcarro ";
    const result = await pool.query(query, [`%${placa.toUpperCase()}%`]);
    console.log(result.rows[0].createat);
    return result.rows;
  },
  async GetListHistoricForUsers({ placa }) {
    const query =
      "select o.idordemdeservico, o.descricao, c.idcarro ,c.modelo, c.placa, c.marca, o.car_km from ordemdeservico o " +
      "left join descricaoservico d on d.idordemdeservico = o.idordemdeservico " +
      "left join carro c on c.idcarro = o.idcarro " +
      "where c.placa = $1 " +
      "group by o.idordemdeservico, c.idcarro ";
    const result = await pool.query(query, [placa.toUpperCase()]);
    return result.rows;
  },
  async GetServiceRestricted({ idordemservico }) {
    const query =
      "select createAt,car_km from ordemdeservico where idordemdeservico = $1";
    const getOS = await pool.query(query, [idordemservico]);
    const getParts = await this.GetPartsRestricted(idordemservico);
    const result = {
      os: getOS.rows,
      parts: getParts,
    };
    return result;
  },
  async GetPartsRestricted(idordemservico) {
    const query =
      "select p.nome ,d.quantidade , p.valorunitario, p.idpeca" +
      " from ordemdeservico o " +
      "inner join descricaoservico d " +
      "on o.idordemdeservico = d.idordemdeservico " +
      "left join pecas p " +
      "on p.idpeca = d.idpeca " +
      "where o.idordemdeservico = $1";
    const result = await pool.query(query, [idordemservico]);
    return result.rows;
  },
  async getAnonymousList({ placa }) {
    const query =
      "select o.idordemdeservico, o.descricao, c.idcarro ,c.modelo, c.placa, c.marca, o.car_km from ordemdeservico o " +
      "left join descricaoservico d on d.idordemdeservico = o.idordemdeservico " +
      "left join carro c on c.idcarro = o.idcarro " +
      "where c.placa = $1 " +
      "group by o.idordemdeservico, c.idcarro ";
    const result = await pool.query(query, [placa.toUpperCase()]);
    return result.rows;
  },
};
module.exports = historic;
