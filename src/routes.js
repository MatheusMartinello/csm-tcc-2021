const express = require("express");
const pool = require("./database/db");
const routes = express.Router();
const user = require("../src/controller/user/usercontroller");
const bcrypt = require("bcrypt");
const workspace = require("./controller/workspace/workspacecontroller");
const admin = require("../src/controller/admin/admin");
const auth = require("./services/authentication");
const multer = require("multer");
const multerConfig = require("./config/multer");
const { transporter } = require("./controller/email/email");
const scheduling = require("./controller/scheduling/schedulingcontroller");
const service = require("./controller/service/servicecontroller");
const historic = require("./controller/historic/historiccontroller");
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
      token: await user.authUser(req.body),
    });
  } catch (err) {
    return res.status(400).send({ message: err, success: "false" });
  }
});
routes.post(
  "/user/document",
  auth.validadeToken,
  multer(multerConfig).single("file"),
  async (req, res) => {
    const { originalname: name, size, key, location: url = "" } = req.file;
    const { idusuario } = req.body;
    user.createDoc(idusuario, url);
    return res.json({ success: true, message: "Documento salvo com sucesso!" });
  }
);
routes.post("/user/authenticate", async (req, res) => {
  try {
    const { login, password } = req.body;
    const getUser = await pool.query(
      "select login,senha,idusuario,nome from usuario where login = $1",
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
      nome: getUser.rows[0].nome,
    });
  } catch (error) {
    return res.status(400).send({ error: error });
  }
});
routes.post("/user/register/car", auth.validadeToken, async (req, res) => {
  try {
    const result = await user.registerCar(req.body);
    return res.send({
      message: "Carro registrado com sucesso!",
      success: true,
      idcarro: result,
    });
  } catch (error) {
    return res.status(400).send({
      messeage: "Não foi possivel registrar veiculo",
      success: false,
      error: error,
    });
  }
});
routes.post(
  "/user/register/cardoc",
  auth.validadeToken,
  multer(multerConfig).single("file"),
  async (req, res) => {
    try {
      const { originalname: name, size, key, location: url = "" } = req.file;
      const { idcarro } = req.body;
      if (!idcarro) {
        return res
          .status(400)
          .json({ sucesso: false, message: "Informe o id do carro." });
      }
      await user.createCarDoc(req.body, url);
      return res.send({
        success: true,
        message: "Documento do carro registrado com sucesso!",
      });
    } catch (error) {
      return res.status(400).send({
        success: false,
        message: "Falha ao salvar o documento",
        error: error,
      });
    }
  }
);
routes.get("/user/get/car", auth.validadeToken, async (req, res) => {
  const result = await user.getUsersCars(req.query);
  if (result == null)
    return res.status(417).send({ message: "Error no banco", success: false });
  return res.send({ cars: result, success: true });
});
routes.put("/user/put/update", auth.validadeToken, async (req, res) => {
  const result = await user.updateUser(req.body);
  if (result)
    return res.send({
      success: true,
      message: "Usuário atualizado com sucesso!",
    });
  else
    return res.status(403).send({
      success: false,
      message: "Algo deu errado",
    });
});
routes.get("/user/scheduling", auth.validadeToken, async (req, res) => {
  const result = await scheduling.workspace();
  return res.send({ success: true, workspace: result });
});
routes.post("/user/scheduling", auth.validadeToken, async (req, res) => {
  try {
    const result = await scheduling.scheduling(req.body);
    if (result) return res.send({ success: true, workspace: result });
    return { success: false, message: "Algo deu errado" };
  } catch (error) {
    res.status(403).send({ success: false, message: error });
  }
});
routes.get(
  "/user/historic/placa/:placa",
  auth.validadeToken,
  async (req, res) => {
    const result = await historic.GetListHistoric(req.params);
    res.send({ success: true, historic: result });
  }
);
routes.get(
  "/user/historic/service/:idordemservico",
  auth.validadeToken,
  async (req, res) => {
    const result = await historic.GetServiceRestricted(req.params);
    res.send({ success: true, service: result });
  }
);
routes.get("/workspace/placa/:placa", auth.validadeToken, async (req, res) => {
  const result = await historic.GetListHistoric(req.params);
  res.send({ success: true, historic: result });
});
routes.get(
  "/workspace/agenda/:idoficina",
  auth.validadeToken,
  async (req, res) => {
    const result = await scheduling.getscheduling(req.params);
    res.send({ success: true, historic: result });
  }
);
routes.post("/workspace/register", async (req, res) => {
  const { login, password, name, cnpj, inscricaoEstadual, email } = req.body;
  if (!login || !password || !name || !cnpj || !inscricaoEstadual || !email)
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
  try {
    const result = await workspace.Register(req.body);

    return res.send({
      massage: "Oficina cadastrada com sucesso!",
      success: "true",
      token: await workspace.authUser(req.body),
    });
  } catch (error) {
    return res.status(400).send({
      error: "Erro durante o processo de registro da ofina",
      success: "false",
    });
  }
});
routes.post("/workspace/authenticate", async (req, res) => {
  try {
    const { login, password } = req.body;
    const getUser = await pool.query(
      "select login,senha,idoficina from oficina where login = $1",
      [login]
    );

    if (
      !getUser.rows[0] ||
      !(await bcrypt.compare(password, getUser.rows[0].senha))
    )
      return res.status(400).send({ error: "Login ou senha Inválidos!" });
    const token = await workspace.authUser(req.body);
    if (token == "error") throw "Algo deu de errado na autenticação";
    return res.send({
      message: "Login logado com sucesso",
      token: token,
      idoficina: getUser.rows[0].idoficina,
    });
  } catch (error) {
    return res.status(400).send({ error: error });
  }
});
routes.post(
  "/workspace/document",
  auth.validadeToken,
  multer(multerConfig).single("file"),
  async (req, res) => {
    const { originalname: name, size, key, location: url = "" } = req.file;
    const { idoficina } = req.body;
    const _return = await workspace.createDoc(idoficina, url);
    if (_return === true)
      return res.json({
        success: true,
        message: "Documento salvo com sucesso!",
      });
    return res
      .status(500)
      .send({ success: false, message: "Algo deu de errado!" });
  }
);
routes.get("/workspace/:idoficina", auth.validadeToken, async (req, res) => {
  console.log("Entrei");
  const result = await workspace.get(req.params);
  return res.send({ success: true, workspace: result });
});
routes.put("/workspace/", auth.validadeToken, async (req, res) => {
  try {
    const result = await workspace.update(req.body);
    if (result)
      return res.send({
        success: true,
        message: "Oficina Atualizada com sucess",
      });
    else throw "Algo deu errado!";
  } catch (error) {
    res.status(500).send({ success: false, message: error });
  }
});
routes.post(
  "/workspace/getListServices",
  auth.validadeToken,
  async (req, res) => {
    try {
      const result = await service.getListServices(req.body);
      return res.send({ success: true, services: result });
    } catch (error) {
      res.status(500).send({ success: false, message: error });
    }
  }
);
routes.post("/workspace/new/service", auth.validadeToken, async (req, res) => {
  const serviceResult = await service.newServicePost(req.body);
  return res.send({
    success: true,
    message: "Ordem de serviço cadastrada com sucesso.",
  });
});
routes.post("/workspace/get/service", auth.validadeToken, async (req, res) => {
  const serviceResult = await service.getService(req.body);
  return res.send({
    success: true,
    serviceResult,
  });
});
routes.put("/workspace/put/service", auth.validadeToken, async (req, res) => {
  try {
    const serviceResult = await service.UpdateService(req.body);
    return res.send({
      success: true,
      message: "Ordem de serviço atualizada com sucesso.",
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err });
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
    console.log(req.body);
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
    "SELECT idusuario,login,cpf,rg,datanascimento,email,statusdocument from Usuario where statusdocument = 3 or statusdocument = 2"
  );
  return res.send({ users: result.rows });
});
routes.get("/admin/getworkspace", auth.validadeToken, async (req, res) => {
  console.log("Entrou aqui");
  const result = await pool.query(
    "SELECT idoficina,login,nome,cnpj,razaosocial,datacriacao,statusdocument,inscricaoestadual from oficina where statusdocument = 3 or statusdocument = 2"
  );
  console.log("Entrou aqui entao nao deu erro");
  return res.send({ users: result.rows });
});
routes.get("/admin/user/toapprove", auth.validadeToken, async (req, res) => {
  return await res.send({ success: true, users: admin.getUsersAprove });
});
routes.get(
  "/admin/user/getalltoaprove",
  auth.validadeToken,
  async (req, res) => {
    try {
      const result = await admin.getTotalAprove();
      return res.send({ success: true, value: result });
    } catch (error) {
      return res.status(400).send({ success: false, message: error });
    }
  }
);
routes.post("/admin/user/getdocument", auth.validadeToken, async (req, res) => {
  try {
    const result = await admin.getDocument(req.body);
    console.log(result);
    return res.send({ success: true, url: result });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});
routes.get(
  "/admin/user/getallcarstoapprove",
  auth.validadeToken,
  async (req, res) => {
    try {
      const result = await admin.GetAllCarsToApprove();
      return res.send({ success: true, cars: result });
    } catch (error) {
      return res.status(400).send({ success: false, error: error });
    }
  }
);
routes.post(
  "/admin/user/car/getdocument",
  auth.validadeToken,
  async (req, res) => {
    try {
      const result = await admin.GetDocumentCar(req.body);
      return res.send({ success: true, document: result });
    } catch (error) {
      return res.status(400).send({ success: false, message: error });
    }
  }
);
routes.post(
  "/admin/workspace/getdocument",
  auth.validadeToken,
  async (req, res) => {
    try {
      const result = await admin.getDocumentWorkspace(req.body);
      return res.send({ success: true, url: result });
    } catch (error) {
      return res.status(400).send({ success: false, message: error });
    }
  }
);
routes.post("/admin/approve", auth.validadeToken, async (req, res) => {
  try {
    const result = await admin.Approve(req.body);
    return res.send({ success: true, message: "Aprovado com sucesso!" });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});
routes.post("/admin/result", auth.validadeToken, async (req, res) => {});

module.exports = routes;
