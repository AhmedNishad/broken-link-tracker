
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

const sendGridKey = process.env.SENDGRID_API_KEY;
const sgMail = require('@sendgrid/mail')
//sgMail.setApiKey(sendGridKey)

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