const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const db = require("./db"); // MySQL connection
const router = express.Router();

// File Upload Setup for Emergency Form
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Register API
router.post("/register", async (req, res) => {
    console.log("Incoming data:", req.body); // Add this line

    const { user_name, age, email, blood_group, mobile, user_password, confirmPassword } = req.body;

    if (!user_name || !age || !email || !blood_group || !mobile || !user_password || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (user_password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        const hashedPassword = await bcrypt.hash(user_password, 10);

        db.query(
            "INSERT INTO users (user_name, age, email, blood_group, mobile, user_password) VALUES (?, ?, ?, ?, ?, ?)",
            [user_name, age, email, blood_group, mobile, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error("Database error:", err); // Log exact DB error
                    return res.status(500).json({ message: "Database error", error: err.message });
                }
                res.status(201).json({ message: "User registered successfully" });
            }
        );
    } catch (error) {
        console.error("Server error:", error); // Catch errors like bcrypt issues
        res.status(500).json({ message: "Server error" });
    }
});


// Login API
router.post("/login", (req, res) => {
    const { user_name, user_password } = req.body;

    if (!user_name || !user_password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    db.query("SELECT * FROM users WHERE user_name = ?", [user_name], async (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = results[0];

        try {
            const isMatch = await bcrypt.compare(user_password, user.user_password);
            if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

            res.status(200).json({
                message: `Welcome ${user.user_name} on Med-Connect`,
                user: {
                  user_name: user.user_name,
                  mobile: user.mobile,
                  blood_group: user.blood_group
                }
              });
              
        } catch (error) {
            console.error("Password verification error:", error);
            res.status(500).json({ message: "Error verifying password" });
        }
    });
});

// Forgot Password
router.post("/forgot-password", (req, res) => {
    const { usernameOrEmail } = req.body;

    if (!usernameOrEmail) {
        return res.status(400).json({ message: "Username or Email is required" });
    }

    db.query("SELECT * FROM users WHERE mobile = ? OR email = ?", [usernameOrEmail, usernameOrEmail], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Reset link sent to your registered contact." });
    });
});

// Emergency Form API
router.post("/emergency", upload.single("image"), (req, res) => {
    const { contact_name, contact_mobile, latitude, longitude } = req.body;
    const imagePath = req.file ? req.file.filename : null;

    if (!contact_name || !contact_mobile || !imagePath) {
        return res.status(400).json({ message: "All fields are required including image." });
    }

    db.query(
        "INSERT INTO emergency_contacts (contact_name, contact_mobile, image, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
        [contact_name, contact_mobile, imagePath, latitude || null, longitude || null],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Database error" });

            res.status(201).json({ message: "Emergency contact submitted successfully." });
        }
    );
});

module.exports = router;
