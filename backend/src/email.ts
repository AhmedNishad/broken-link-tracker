
const nodemailer = require("nodemailer");


// async..await is not allowed in global scope, must use a wrapper
async function sendMail(requestId: string, toAddress: string, htmlContent: string) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log(htmlContent);
  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'nishad@onepercentdev.com', // sender address
    to: toAddress, 
    subject: "Completed Broken Link Analysis",
    html: htmlContent, 
  });

  console.log("Message sent: %s", info.messageId);

}

module.exports = {
    sendMail: sendMail
}

export {}