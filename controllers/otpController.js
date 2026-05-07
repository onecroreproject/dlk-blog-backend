const Otp = require("../models/Otp");

exports.generateOtp = async (req, res) => {
  try {
    // Check if there's already an active (non-expired) OTP
    const latestOtp = await Otp.findOne().sort({ createdAt: -1 });
    const now = new Date();
    
    if (latestOtp && now <= latestOtp.expiresAt) {
      return res.status(200).json({ 
        message: "Active OTP already exists", 
        otp: latestOtp 
      });
    }

    // Generate 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Set expiry to midnight
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    const newOtp = new Otp({ code, expiresAt });
    await newOtp.save();

    res.status(201).json({ message: "OTP generated successfully", otp: newOtp });
  } catch (error) {
    res.status(500).json({ message: "Error generating OTP", error: error.message });
  }
};

exports.getLatestOtp = async (req, res) => {
  try {
    const latestOtp = await Otp.findOne().sort({ createdAt: -1 });
    
    if (!latestOtp) {
      return res.status(404).json({ message: "No OTP found" });
    }

    // Check if valid (not expired)
    const now = new Date();
    if (now > latestOtp.expiresAt) {
      return res.status(410).json({ message: "OTP expired", isExpired: true });
    }

    res.json(latestOtp);
  } catch (error) {
    res.status(500).json({ message: "Error fetching OTP", error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { code } = req.body;
    const latestOtp = await Otp.findOne().sort({ createdAt: -1 });

    if (!latestOtp) {
      return res.status(404).json({ message: "No active OTP found" });
    }

    const now = new Date();
    if (now > latestOtp.expiresAt) {
      return res.status(410).json({ message: "OTP has expired" });
    }

    if (latestOtp.code === code) {
      res.json({ success: true, message: "OTP verified successfully" });
    } else {
      res.status(401).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP", error: error.message });
  }
};

