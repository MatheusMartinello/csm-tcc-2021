var nodemailer = require("nodemailer");
var { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
async function sendEmail(to, body, subject) {
  try {
    console.log("Entrou");
    const accessToken = await oAuth2Client.getAccessToken();
    console.log(accessToken);
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_SENDER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `CSM 😃< ${process.env.EMAIL_SENDER}>`,
      to: to,
      subject: subject,
      text: body,
      html: `<h1>${body}</h1>`,
    };
    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
module.exports = sendEmail;
