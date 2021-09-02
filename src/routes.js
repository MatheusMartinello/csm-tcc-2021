const express = require("express");
const pool = require("./database/db");
const routes = express.Router();
const user = require("../src/controller/user/usercontroller");
const bcrypt = require("bcrypt");
const workspace = require("./controller/workspace/workspacecontroller");
const admin = require("../src/controller/admin/admin");
const auth = require("./services/authentication");
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
      "select login,senha,idusuario from usuario where login = $1",
      [login]
    );

    if (
      !getUser.rows[0] ||
      !(await bcrypt.compare(password, getUser.rows[0].senha))
    )
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    const token = await user.authUser(req.body);
    if (token == "error") throw "Algo deu de errado na autenticação";
    return res.send({
      message: "Login logado com sucesso",
      token: token,
      idusuario: getUser.rows[0].idusuario,
    });
  } catch (error) {
    return res.status(400).send({ error: error });
  }
});
routes.post("/user/register/car", auth.validadeToken, async (req, res) => {
  const result = await user.registerCar(req.body);
  if (!result)
    res
      .status(400)
      .send({ messeage: "Não foi possivel registrar veiculo", success: false });
  res.send({ message: "Carro registrado com sucesso!", success: true });
});
routes.get("/user/get/car", auth.validadeToken, async (req, res) => {
  const result = await user.getUsersCars(req.body);
  if (result == null)
    return res.status(417).send({ message: "Error no banco", success: false });
  return res.send({ cars: result, success: true });
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

    if (
      !getUser.rows[0] ||
      !(await bcrypt.compare(password, getUser.rows[0].senha))
    )
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    const token = await workspace.authUser(req.body);
    if (token == "error") throw "Algo deu de errado na autenticação";
    return res.send({ message: "Login logado com sucesso", token: token });
  } catch (error) {
    return res.status(400).send({ error: error });
  }
});
routes.post("/admin/register", async (req, res) => {
  await admin.Register(req.body);
  return res.send({ mensage: "Registado com sucesso" });
});
routes.post("/admin/auth", async (req, res) => {
  try {
    const { login, password } = req.body;
    const getUser = await pool.query(
      "select idusuarioadmin,login,senha from usuariosadmin where login = $1",
      [login]
    );
    if (
      !getUser.rows[0] ||
      !(await bcrypt.compare(password, getUser.rows[0].senha))
    )
      return res.status(400).send({ error: "Login ou senha Inválidos!" });

    const token = await admin.authUser(req.body);

    if (token == "error") throw "Algo deu de errado na autenticação";
    return res.send({ message: "Login logado com sucesso", token: token });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ error: error });
  }
});
routes.get("/admin/getUser", auth.validadeToken, async (req, res) => {
  const result = await pool.query(
    "SELECT idusuario,login,cpf,rg,datanascimento,email,aprovado from Usuario where aprovado = false"
  );
  return res.send({ users: result.rows });
});
routes.get("/admin/getWorkspace", auth.validadeToken, async (req, res) => {
  const result = await pool.query(
    "SELECT idoficina,login,nome,cnpj,razaosocial,datacriacao,aprovado from oficina where aprovado = false"
  );
  return res.send({ users: result.rows });
});
routes.get("/admin/user/toaprove", auth.validadeToken, async (req, res) => {
  return await res.send({ success: true, users: admin.getUsersAprove });
});
module.exports = routes;
