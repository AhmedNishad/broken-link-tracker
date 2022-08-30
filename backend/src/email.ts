
const nodemailer = require("nodemailer");

const baseURL = process.env.BASE_APP_URL || `localhost:3000`;

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(requestId: string, toAddress: string) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "15dcb0e2063157",
        pass: "b65d271f1b5e4d"
    }
  });

  let url = `${baseURL}/results?id=${requestId}`

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: toAddress, 
    subject: "Completed Broken Link Analysis",
    text: "Mew has crawled through all your links", 
    html: `<b>Hi, Mew Has Finally Finished Crawling All Your Broken Links!</b>
            <p>You can find them </p>
            <a href='${url}' >here ;)</a>`, 
  });

  console.log("Message sent: %s", info.messageId);

}

module.exports = {
    sendMail
}

export {}