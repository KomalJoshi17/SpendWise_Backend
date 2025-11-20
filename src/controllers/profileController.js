const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

let otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"SpendWise" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
};

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
};

const requestEmailOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    console.log("📩 Incoming email-change request for user:", user.email);

    const { newEmail } = req.body;
    console.log("👉 New email requested:", newEmail);

    if (!newEmail)
      return res.status(400).json({ message: "New email required" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("🔐 Generated OTP:", otp);

    otpStore[user._id] = {
      otp,
      newEmail,
      expires: Date.now() + 5 * 60 * 1000,
    };

    console.log("💾 OTP stored in memory:", otpStore[user._id]);

    await sendEmail(
      user.email,
      "SpendWise Email Change Verification",
      `<h2>Your OTP is: <b>${otp}</b></h2><p>Valid for 5 minutes.</p>`
    );

    console.log("📨 Email successfully sent to:", user.email);

    res.json({ message: "OTP sent to your old email" });

  } catch (err) {
    console.error("❌ ERROR in requestEmailOtp:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyEmailOtp = async (req, res) => {
  const userId = req.user._id;
  const { otp } = req.body;

  const stored = otpStore[userId];
  if (!stored) return res.status(400).json({ message: "No OTP generated" });

  if (Date.now() > stored.expires)
    return res.status(400).json({ message: "OTP expired" });

  if (stored.otp.toString() !== otp.toString())
    return res.status(400).json({ message: "Invalid OTP" });

  const user = await User.findById(userId);

  user.email = stored.newEmail;
  await user.save();

  delete otpStore[userId];

  res.json({ message: "Email updated successfully", email: user.email });
};

const updateProfile = async (req, res) => {
  const { name } = req.body;

  const user = await User.findById(req.user._id);
  if (name) user.name = name;

  await user.save();
  res.json(user);
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isMatch = await user.matchPassword(oldPassword);
  if (!isMatch) return res.status(401).json({ message: "Incorrect old password" });

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password changed successfully" });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  requestEmailOtp,
  verifyEmailOtp,
};
