const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();
const db = require("../db");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "agrilink_super_secret_key_change_this";

/*
==================================================
LOGIN
POST /api/auth/login
==================================================
*/

router.post("/login", async (req, res) => {
  try {
    const {
      identifier,
      password,
      role
    } = req.body;

    console.log("Login request:", {
      identifier,
      role,
      passwordProvided: !!password
    });

    if (!identifier || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required."
      });
    }

    const sql = `
      SELECT *
      FROM users
      WHERE email = ?
      AND role = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [identifier, role],
      async (err, results) => {

        /*
        ==========================================
        DATABASE ERROR
        ==========================================
        */

        if (err) {
          console.error(
            "LOGIN DATABASE ERROR:",
            err
          );

          return res.status(500).json({
            message: "Database error.",
            error: err.message,
            code: err.code
          });
        }

        /*
        ==========================================
        USER NOT FOUND
        ==========================================
        */

        if (results.length === 0) {
          return res.status(401).json({
            message:
              "Invalid credentials or role."
          });
        }

        const user = results[0];

        /*
        ==========================================
        PASSWORD CHECK
        ==========================================
        */

        try {
          const passwordMatch =
            await bcrypt.compare(
              password,
              user.password
            );

          if (!passwordMatch) {
            return res.status(401).json({
              message:
                "Invalid credentials."
            });
          }

          /*
          ========================================
          CREATE JWT TOKEN
          ========================================
          */

          const token = jwt.sign(
            {
              id: user.id,
              email: user.email,
              role: user.role
            },
            JWT_SECRET,
            {
              expiresIn: "7d"
            }
          );

          /*
          ========================================
          SUCCESS RESPONSE
          ========================================
          */

          return res.json({
            message:
              "Login successful.",

            token,

            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });

        } catch (passwordError) {

          console.error(
            "PASSWORD VERIFICATION ERROR:",
            passwordError
          );

          return res.status(500).json({
            message:
              "Unable to verify password.",
            error:
              passwordError.message
          });
        }
      }
    );

  } catch (error) {

    console.error(
      "LOGIN SERVER ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server error.",
      error: error.message
    });
  }
});


/*
==================================================
REGISTER
POST /api/auth/register
==================================================
*/

router.post("/register", async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      role
    } = req.body;

    /*
    ==========================================
    VALIDATION
    ==========================================
    */

    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        message:
          "Name, email, password and role are required."
      });
    }

    /*
    ==========================================
    ALLOWED ROLES
    ==========================================
    */

    const allowedRoles = [
      "farmer",
      "buyer",
      "fpo"
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message:
          "Invalid registration role."
      });
    }

    /*
    ==========================================
    CHECK EXISTING EMAIL
    ==========================================
    */

    db.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],

      async (err, results) => {

        if (err) {

          console.error(
            "REGISTRATION DATABASE ERROR:",
            err
          );

          return res.status(500).json({
            message:
              "Database error.",
            error:
              err.message,
            code:
              err.code
          });
        }

        /*
        ========================================
        EMAIL ALREADY EXISTS
        ========================================
        */

        if (results.length > 0) {
          return res.status(409).json({
            message:
              "Email already registered."
          });
        }

        /*
        ========================================
        HASH PASSWORD
        ========================================
        */

        try {

          const hashedPassword =
            await bcrypt.hash(
              password,
              10
            );

          /*
          ======================================
          INSERT USER
          ======================================
          */

          const sql = `
            INSERT INTO users
            (
              name,
              email,
              password,
              role
            )
            VALUES (?, ?, ?, ?)
          `;

          db.query(
            sql,
            [
              name,
              email,
              hashedPassword,
              role
            ],

            (err, result) => {

              if (err) {

                console.error(
                  "USER INSERT ERROR:",
                  err
                );

                return res.status(500).json({
                  message:
                    "Unable to create account.",
                  error:
                    err.message,
                  code:
                    err.code
                });
              }

              /*
              ==================================
              REGISTRATION SUCCESS
              ==================================
              */

              return res.status(201).json({
                message:
                  "Registration successful.",

                userId:
                  result.insertId
              });
            }
          );

        } catch (hashError) {

          console.error(
            "PASSWORD HASHING ERROR:",
            hashError
          );

          return res.status(500).json({
            message:
              "Unable to secure password.",
            error:
              hashError.message
          });
        }
      }
    );

  } catch (error) {

    console.error(
      "REGISTRATION SERVER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error.",
      error:
        error.message
    });
  }
});


/*
==================================================
EXPORT ROUTER
==================================================
*/

module.exports = router;