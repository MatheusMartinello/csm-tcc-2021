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
  async scheduling({ idoficina, idusuario, dateTime, idcarro = null }) {
    const date = format(parseISO(dateTime), "MM/dd/yyyy hh:mma");
    const dateEnd = format(
      (parseISO(new Date().setDate() + 7), "MM/dd/yyyy hh:mma")
    );
    try {
      if (idcarro == null) {
        await pool.query(
          "insert into agenda (idusuario,idoficina,datahorario,datahorafim) values ($1,$2,$3)",
          [idusuario, idoficina, date, dateEnd]
        );
        return true;
      }
      await pool.query(
        "insert into agenda (idusuario,idoficina,datahorario,idcarro,datahorafim) values ($1,$2,$3)",
        [idusuario, idoficina, date, idcarro, dataEnd]
      );
      return true;
    } catch (error) {
      throw error;
    }
  },
  async getscheduling({ idoficina }) {
    try {
      const result = await pool.query(
        "SELECT * FROM agenda where a.idoficina = $1",
        [idoficina]
      );
      return result.rows[0];
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};

module.exports = scheduling;
