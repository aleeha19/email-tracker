require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json()); // Ensure JSON parsing is enabled before routes
app.use(express.static("public")); // Serve static files

// ✅ Global Error Handler for Invalid JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        console.error("❌ Invalid JSON:", err);
        return res.status(400).json({ error: "Invalid JSON payload" });
    }
    next();
});

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// ✅ Define Email Schema
const EmailSchema = new mongoose.Schema({
  email: String,
  subject: String,
  body: String,
  status: { type: String, default: "Sent" },
  timestamp: { type: Date, default: Date.now }
});
const Email = mongoose.model("Email", EmailSchema);

// ✅ Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ API to Send Email (Includes Click & Open Tracking)
app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const trackingLink = `http://localhost:3000/click?email=${encodeURIComponent(to)}`;
    const trackingPixel = `<img src="http://localhost:3000/track?email=${encodeURIComponent(to)}&t=${Date.now()}" width="1" height="1" />`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `<p>${body}</p>
             <p><a href="${trackingLink}" target="_blank">Click here to view</a></p>
             ${trackingPixel}`,
    };

    await transporter.sendMail(mailOptions);
    await Email.create({ email: to.trim(), subject, body });

    res.json({ message: "✅ Email Sent!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ error: "❌ Email sending failed" });
  }
});

// ✅ Click Tracking Route
app.get("/click", async (req, res) => {
  const email = req.query.email ? req.query.email.trim() : null;
  if (!email) return res.status(400).send("❌ No email provided");

  try {
    console.log(`🖱️ Click detected for: ${email}`);

    const updated = await Email.updateMany({ email }, { status: "Clicked" });

    if (updated.modifiedCount > 0) {
      console.log(`✅ Email status updated to 'Clicked' for: ${email}`);
    } else {
      console.log(`⚠️ No matching emails found for: ${email}`);
    }
  } catch (error) {
    console.error("❌ Error updating status:", error);
  }

  res.redirect("https://your-destination-link.com"); // Change this to actual content URL
});

// ✅ Open Tracking (Pixel Image)
app.get("/track", async (req, res) => {
  const email = req.query.email ? req.query.email.trim() : null;
  if (!email) return res.status(400).send("❌ No email provided");

  try {
    console.log(`📩 Tracking email open for: ${email}`);

    const updated = await Email.updateMany({ email }, { status: "Opened" });

    if (updated.modifiedCount > 0) {
      console.log(`✅ Email status updated to 'Opened' for: ${email}`);
    } else {
      console.log(`⚠️ No matching emails found for: ${email}`);
    }
  } catch (error) {
    console.error("❌ Error updating status:", error);
  }

  res.sendFile(path.join(__dirname, "public", "tracking-pixel.png"));
});

// ✅ API to Get Email Statuses
app.get("/email-status", async (req, res) => {
  try {
    const emails = await Email.find().sort({ timestamp: -1 });
    res.json(emails);
  } catch (error) {
    console.error("❌ Failed to fetch email statuses:", error);
    res.status(500).json({ error: "❌ Failed to fetch email statuses" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
