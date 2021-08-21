const express = require("express");
const pool = require("./database/db");
const routes = express.Router();
const user = require("../src/controller/user/usercontroller");
const bcrypt = require("bcrypt");
const workspace = require("./controller/workspacecontroller/workspacecontroller");
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
    return res.status(400).send({
      error: "É necessário o envio de todos os itens de cadastro!",
      success: "false",
    });
  const checkUser = await pool.query("SELECT 1 FROM usuario WHERE login = $1", [
    login,
  ]);
  if (checkUser.rows[0])
    return res
      .status(400)
      .send({ error: "Login já cadastrado no sistema!", success: "false" });
  if (password.lenght < 6)
    return res.status(400).send({
      error: "Senha deve conter mais do que 6 dígitos!",
      success: "false",
    });
  try {
    await user.createUser(req.body);
    return res.send({
      message: "Usuário cadastrado com sucesso!",
      success: "true",
    });
  } catch (err) {
    return res.status(400).send({ message: err, success: "false" });
  }
});
routes.post("/user/authenticate", async (req, res) => {
  try {
    const { login, password } = req.body;
    const getUser = await pool.query(
      "select login,senha from usuario where login = $1",
      [login]
    );
    console.log(getUser);
    if (!getUser.rows[0])
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    if (!(await bcrypt.compare(password, getUser.rows[0].senha)))
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    const token = await user.authUser(req.body);
    if (token == "error") throw "Algo deu de errado na autenticação";
    return res.send({ message: "Login logado com sucesso", token: token });
  } catch (error) {
    return res.status(400).send({ error: error });
  }
});
routes.post("/workspace/register", async (req, res) => {
  const { login, password, name, cnpj, razaosocial, bornDate, email } =
    req.body;
  if (
    !login ||
    !password ||
    !name ||
    !cnpj ||
    !razaosocial ||
    !bornDate ||
    !email
  )
    return res
      .status(400)
      .send({ error: "É necessário o envio de todos os itens de cadastro!" });
  const checkWorkspace = await pool.query(
    "SELECT 1 FROM oficina WHERE login = $1",
    [login]
  );
  if (checkWorkspace.rows[0])
    return res
      .status(400)
      .send({ error: "Login já cadastrado no sistema!", success: false });
  if (password.lenght < 6)
    return res.status(400).send({
      error: "Senha deve conter mais do que 6 dígitos!",
      success: "false",
    });

  const result = await workspace.Register(req.body);
  if (result == "error")
    return res.status(400).send({
      error: "Erro durante o processo de registro da ofina",
      success: "false",
    });
  return res.send({
    massage: "Oficina cadastrada com sucesso!",
    success: "true",
  });
});
routes.post("/workspace/authenticate", async (req, res) => {
  try {
    const { login, password } = req.body;
    const getUser = await pool.query(
      "select login,senha from oficina where login = $1",
      [login]
    );
    console.log(getUser);
    if (!getUser.rows[0])
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    if (!(await bcrypt.compare(password, getUser.rows[0].senha)))
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    const token = await workspace.authUser(req.body);
    if (token == "error") throw "Algo deu de errado na autenticação";
    return res.send({ message: "Login logado com sucesso", token: token });
  } catch (error) {
    return res.status(400).send({ error: error });
  }
});
module.exports = routes;
