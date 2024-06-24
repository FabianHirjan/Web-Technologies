const crypto = require("crypto");
const { User } = require("../models");
const jwt = require("jsonwebtoken");
const secretKey = "abc1234";

/**
 * Hashes a password using the SHA256 algorithm.
 *
 * @param {string} password - The password to be hashed.
 * @returns {string} The hashed password.
 */
const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(users));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  },

  getUserById: async (req, res, id) => {
    try {
      const user = await User.findByPk(id);
      if (user) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(user));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  },

  createUser: async (req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const { username, email, password, is_admin = false } = JSON.parse(body);
      if (!username || !email || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing fields" }));
        return;
      }

      try {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(
              JSON.stringify({
                error: "Account with the same username already exists",
              })
          );
          return;
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(
              JSON.stringify({
                error: "Account with the same email already exists",
              })
          );
          return;
        }

        const hashedPassword = hashPassword(password);
        await User.create({ username, email, password: hashedPassword, is_admin });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User created successfully" }));
      } catch (err) {
        console.error("Error during user creation:", err); // Log the error
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User creation failed" }));
      }
    });
  },

  updateUser: async (req, res, id) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const { username, email, password, is_admin } = JSON.parse(body);

      try {
        const user = await User.findByPk(id);
        if (user) {
          const updateData = { username, email, is_admin };
          if (password) {
            updateData.password = hashPassword(password);
          }
          await user.update(updateData);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(user));
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "User not found" }));
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  },

  deleteUser: async (req, res, id) => {
    try {
      const user = await User.findByPk(id);
      if (user) {
        await user.destroy();
        res.writeHead(204, { "Content-Type": "application/json" });
        res.end();
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  },

  updateUserEmail: async (req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const { email, password } = JSON.parse(body);
      if (!email || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing fields" }));
        return;
      }

      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, secretKey);
        const user = await User.findByPk(decoded.id);
        if (user && user.password === hashPassword(password)) {
          await user.update({ email });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Email updated successfully" }));
        } else {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid credentials" }));
        }
      } catch (error) {
        console.error("Error during email update:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Email update failed" }));
      }
    });
  },

  updateUserPassword: async (req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const { newPassword, oldPassword } = JSON.parse(body);
      if (!newPassword || !oldPassword) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing fields" }));
        return;
      }

      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, secretKey);
        const user = await User.findByPk(decoded.id);
        if (user && user.password === hashPassword(oldPassword)) {
          await user.update({ password: hashPassword(newPassword) });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Password updated successfully" }));
        } else {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid credentials" }));
        }
      } catch (error) {
        console.error("Error during password update:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Password update failed" }));
      }
    });
  },

  getCurrentUser: async (req, res) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, secretKey);
      const user = await User.findByPk(decoded.id);
      if (user) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(user));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to fetch user data" }));
    }
  }
};

module.exports = userController;
