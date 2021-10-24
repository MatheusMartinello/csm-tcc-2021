const pool = require("../../database/db");
const { format, parseISO } = require("date-fns");
const scheduling = {
  async workspace() {
    try {
      const result = await pool.query(
        "select e.latitude, e.longitude, o.nome, o.idoficina from endereco e inner join oficina o on e.idoficina = o.idoficina "
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  async scheduling({ idoficina, idusuario, dateTime }) {
    const date = format(parseISO(dateTime), "MM/dd/yyyy hh:mma");
    console.log(date);
    try {
      await pool.query(
        "insert into agenda (idusuario,idoficina,datahorario) values ($1,$2,$3)",
        [idusuario, idoficina, date]
      );
      return true;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = scheduling;
