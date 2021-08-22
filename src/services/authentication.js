const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth.json");

const auth = {
  async getToken(id) {
    return jwt.sign({ id }, authConfig.secret, {
      expiresIn: 86400,
    });
  },
  async validadeToken(req, res, next) {
    const token = req.header("x-access-token");
    if (!token)
      return res
        .status(401)
        .json({ auth: false, message: "No token provided." });
    jwt.verify(token, authConfig.secret, (err, decoded) => {
      if (err)
        return res
          .status(500)
          .send({ auth: false, message: "Failed to authenticate token." });

      next();
    });
  },
};
module.exports = auth;
