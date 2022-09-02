
const nodemailer = require("nodemailer");

const baseURL = process.env.BASE_APP_URL || `localhost:3000`;

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(requestId: string, toAddress: string) {
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

  let url = `${baseURL}/results?id=${requestId}`

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'nishad@onepercentdev.com', // sender address
    to: toAddress, 
    subject: "Completed Broken Link Analysis",
    text: "Mew has crawled through all your links", 
    html: `<b>Hi, Mew Has Finally Finished Crawling All Your Broken Links!</b>
            <p>You can find them </p>
            <a href='${url}' >here ;)</a>`, 
  });

  console.log("Message sent: %s", info.messageId);

}

const sendGridKey = process.env.SENDGRID_API_KEY;
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(sendGridKey)

async function sendMailSendgrid(requestId: string, toAddress: string){
  const msg = {
    to: toAddress, // Change to your recipient
    from: 'purrlinq@mail.com', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  }
  
  console.log(msg);
  sgMail.send(msg).then((response: any) => {
    console.log(response[0].statusCode)
    console.log('Email sent')
  })
  .catch((error: any) => {
    console.error(error)
  })

  /* try{
    await sgMail.send(msg);
  }catch(e){
    console.error(e)
  } */
}

module.exports = {
    sendMail: sendMail
}

export {}