const Otp = require("../models/Otp");

exports.generateOtp = async (req, res) => {
  try {
    const now = new Date();
    
    // Calculate current IST date (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    // Target: 11:59:59.999 PM IST for today (which is 18:29:59.999 UTC)
    // We use the IST date components to ensure we target the correct calendar day in India
    const expiresAt = new Date(Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
      18, 29, 59, 999
    ));

    // Check if there's already an active (non-expired) OTP
    const latestOtp = await Otp.findOne().sort({ createdAt: -1 });
    
    if (latestOtp && now <= latestOtp.expiresAt) {
      return res.status(200).json({ 
        message: "Active OTP already exists", 
        otp: latestOtp 
      });
    }

    // Generate 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    const newOtp = new Otp({ code, expiresAt });
    await newOtp.save();

    res.status(201).json({ message: "OTP generated successfully", otp: newOtp });
  } catch (error) {
    res.status(500).json({ message: "Error generating OTP", error: error.message });
  }
};

exports.getLatestOtp = async (req, res) => {
  try {
    const now = new Date();
    
    // Calculate current IST date (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    // Target: 11:59:59.999 PM IST for today (which is 18:29:59.999 UTC)
    const expiresAt = new Date(Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
      18, 29, 59, 999
    ));

    // Remove any expired OTPs first to keep the DB clean
    await Otp.deleteMany({ expiresAt: { $lt: now } });

    let latestOtp = await Otp.findOne().sort({ createdAt: -1 });

    // If no OTP exists (or all were expired and deleted), generate a new one
    if (!latestOtp) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      latestOtp = new Otp({ code, expiresAt });
      await latestOtp.save();
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

