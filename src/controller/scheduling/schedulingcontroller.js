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
  async scheduling({ idoficina, idusuario, dateTime, idcarro }) {
    const result = parseISO(dateTime).setDate(
      parseISO(dateTime).getDate() + 11
    );

    const date = format(parseISO(dateTime), "MM/dd/yyyy hh:mma");

    const dateEnd = format(result, "MM/dd/yyyy hh:mma");
    console.log(dateEnd);
    try {
      await pool.query("begin");
      if (idcarro == null) {
        console.log("ERRODESC");
        await pool.query(
          "insert into agenda (idusuario,idoficina,datahorario,datahorafim) values ($1,$2,$3,$4)",
          [idusuario, idoficina, date, dateEnd]
        );
        return true;
      }
      await pool.query(
        "insert into agenda (idusuario,idoficina,datahorario,idcarro,datahorafim) values ($1,$2,$3,$4,$5)",
        [idusuario, idoficina, date, idcarro, dateEnd]
      );
      await pool.query(
        "INSERT INTO ordemdeservico (idoficina,idcarro,idusuario,status) values($1,$2,$3,$4) returning *",
        [idoficina, idcarro, idusuario, "Pendente"]
      );
      await pool.query("end");
      return true;
    } catch (error) {
      await pool.query("rollback");
      console.log(error);
      throw error;
    }
  },
  async getscheduling({ idoficina }) {
    try {
      const result = await pool.query(
        "SELECT a.idagenda, a.idusuario, a.idcarro ,a.idoficina ,to_char(a.datahorario , 'YYYY-MM-DD') as datahorario, to_char(a.datahorafim, 'DD/MM/YYYY') as datahorafim FROM agenda a where a.idoficina = $1",
        [idoficina]
      );
      return result.rows;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};

module.exports = scheduling;
