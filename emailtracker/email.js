require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public"))); 

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

const EmailSchema = new mongoose.Schema({
  email: String,
  subject: String,
  body: String,
  status: { type: String, default: "Sent" },
});
const Email = mongoose.model("Email", EmailSchema);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/send-email", async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `${body} <img src="http://localhost:3000/track?email=${to}" width="1" height="1" />`,
    });

    const emailRecord = await Email.create({ email: to, subject, body });
    res.json({ message: "✅ Email Sent!", email: emailRecord });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "❌ Email sending failed" });
  }
});

app.get("/track", async (req, res) => {
  const { email } = req.query;
  await Email.findOneAndUpdate({ email }, { status: "Opened" });
  res.sendFile(path.join(__dirname, "public", "tracking-pixel.png"));
});

app.get("/emails", async (req, res) => {
  res.json(await Email.find());
});

app.delete("/delete-email/:id", async (req, res) => {
  try {
    await Email.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Email deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "❌ Failed to delete email" });
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
