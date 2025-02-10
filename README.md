I tried setting up SendGrid, but it kept blocking me and asking for debit card info.
 The same happened with Mailgun. Since I don’t have a card,
  I used Nodemailer with SMTP and an app password. The emails are sending fine, but tracking opens 
  isn’t working properly since Nodemailer doesn’t have built-in tracking.
