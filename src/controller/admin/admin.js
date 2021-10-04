const pool = require("../../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");

const admin = {
  async Register({ login, password }) {
    try {
      password = await bcrypt.hash(password, 15);
      await pool.query(
        "INSERT INTO usuariosadmin(login,senha) values ($1,$2)",
        [login, password]
      );
      return true;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  async authUser({ login }) {
    try {
      const getuser = await pool.query(
        "select idusuarioadmin from usuariosadmin where login = $1",
        [login]
      );
      if (getuser.rows[0] == null) return "error";
      const token = jwt.sign(
        { id: getuser.rows[0].idoficina },
        authConfig.secret,
        {
          expiresIn: 86400,
        }
      );
      return token;
    } catch (error) {
      return error;
    }
  },
  async getUsersAprove() {
    try {
      const result = await pool.query(
        "select idusuario,nome,email,cpf,rg,datanascimento,login from usuario u where u.aprovado = false"
      );
      return result.rows;
    } catch (error) {
      console.error(error);
    }
  },
  async getTotalAprove() {
    try {
      const userResultNotApprove = await pool.query(
        "SELECT COUNT(*) from usuario u where statusdocument= 2"
      );

      const userResultApprove = await pool.query(
        "SELECT COUNT(*) from usuario u where statusdocument= 1"
      );

      const workspaceResultNotApprove = await pool.query(
        "SELECT COUNT(*) from oficina o where statusdocument= 2"
      );

      const workspaceResultApprove = await pool.query(
        "SELECT COUNT(*) from oficina o where statusdocument = 1"
      );

      const carResultNotApprove = await pool.query(
        "select count(*) from carro where statusdocument= 2"
      );

      const carResultApprove = await pool.query(
        "select count(*) from carro where statusdocument = 1"
      );

      const carResultPendent = await pool.query(
        "select count(*) from carro where statusdocument = 3"
      );

      const userPendent = await pool.query(
        "select count(*) from usuario where statusdocument = 3"
      );

      const workspacePendent = await pool.query(
        "select count(*) from oficina where statusdocument = 3"
      );

      const resultObj = {
        usuariosNaoAprovados: userResultNotApprove.rows[0].count,
        usuariosAprovados: userResultApprove.rows[0].count,
        usuarioPendente: userPendent.rows[0].count,
        oficinasNaoAprovados: workspaceResultNotApprove.rows[0].count,
        oficinasAprovados: workspaceResultApprove.rows[0].count,
        oficinasPendente: workspacePendent.rows[0].count,
        carrosNaoAprovados: carResultNotApprove.rows[0].count,
        carrosAprovados: carResultApprove.rows[0].count,
        carrosPendentes: carResultPendent.rows[0].count,
      };

      return resultObj;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  async getDocument({ idusuario }) {
    try {
      const result = await pool.query(
        "select d.urldocumento  from usuario u inner join dadosimagem d on u.idusuario = d.idusuario where u.statusdocument = 3  and d.tipodocumento = 1 and u.idusuario = $1",
        [idusuario]
      );
      console.log(result);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  async getDocumentWorkspace({ idoficina }) {
    try {
      const result = await pool.query(
        "select d.urldocumento  from oficina o inner join dadosimagem d on o.idoficina = d.idoficina where o.statusdocument = 3  and d.tipodocumento = 4 and o.idoficina = $1",
        [idoficina]
      );
      console.log(result);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
  async GetAllCarsToApprove() {
    try {
      const result = await pool.query(
        "select c.*,u.login from carro c left join usuario u on u.idusuario = c.idusuario where statusdocument = 3  "
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  async GetDocumentCar({ idusuario, idcarro }) {
    try {
      const result = await pool.query(
        "SELECT urldocumento,idcarro,idusuario from dadosimagem where idusuario = $1 and idcarro = $2 and idtipo = 3",
        [idusuario, idcarro]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  async GetDocumentOficina({ idoficina }) {
    try {
      const result = await pool.query(
        "select o.nome , o.razaosocial ,o.cnpj ,o.login ,incricaoestadual from oficina o where idoficina = $1",
        [idoficina]
      );
    } catch (error) {
      throw error;
    }
  },
  async Approve({ idusuario = null, idoficina = null, idcarro = null }) {
    try {
      console.log(idusuario);
      console.log(idcarro);
      console.log(idoficina);
      if (idusuario != undefined && (idcarro == null || idcarro == undefined)) {
        await pool.query(
          "update usuario set statusdocument = 1 where IdUsuario = $1",
          [idusuario]
        );
        return;
      }
      if (idusuario != null && idcarro != null) {
        await pool.query(
          "update carro set statusdocument = 1  where idusuario = $1 and idcarro = $2",
          [idusuario, idcarro]
        );
        return;
      }
      if (idoficina != null) {
        await pool.query(
          "update oficina set statusdocument = 1  where idoficina = $1 ",
          [idoficina]
        );
        return;
      }
      throw "Chegou aqui é pq deu ruim";
    } catch (error) {
      throw error;
    }
  },
};

module.exports = admin;
