const pool = require("../../database/db");
const car = {
  async GetCarPlaca({ placa }) {
    const result = await pool.query(
      "select idcarro,placa,modelo,marca from carro where placa = $1",
      [placa]
    );
    return result;
  },
};

module.exports = car;
