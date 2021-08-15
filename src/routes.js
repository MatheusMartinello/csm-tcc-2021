const express = require("express");
const pool = require("./database/db");
const routes = express.Router();
const user = require("../src/controller/user/usercontroller");
const bcrypt = require("bcrypt");
routes.get("/", async (req, res) => {
  try {
    res.json({ message: "Conexão está OK!" });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});

routes.post("/user/register", async (req, res) => {
  const { login, password, name, cpf, rg, bornDate, email } = req.body;
  //check if login already have in db
  if (!login || !password || !name || !cpf || !rg || !bornDate || !email)
    return res
      .status(400)
      .send({ error: "É necessário o envio de todos os itens de cadastro!" });
  const checkUser = await pool.query("SELECT 1 FROM usuario WHERE login = $1", [
    login,
  ]);
  if (checkUser.rows[0])
    return res.status(400).send({ error: "Login já cadastrado no sistema!" });
  if (password.lenght < 6)
    return res
      .status(400)
      .send({ error: "Senha deve conter mais do que 6 dígitos!" });
  try {
    await user.createUser(req.body);
    return res.send({ message: "Usuário cadastrado com sucesso!" });
  } catch (err) {
    return res.status(400).send({ message: err });
  }
});
routes.post("/user/authenticate", async (req, res) => {
  try {
    const { login, password } = req.body;
    const getUser = await pool.query(
      "select login,senha from usuario where login = $1",
      [login]
    );
    if (!getUser.rows[0])
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    if (!(await bcrypt.compare(password, getUser.rows[0].senha)))
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    const token = await user.authUser(req.body);
    return res.send({ message: "Login logado com sucesso", token: token });
  } catch (error) {
    return res.status(400).send({ error: error });
  }
});
module.exports = routes;
