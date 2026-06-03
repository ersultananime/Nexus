const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkeyforexpressapplicaton54321!";

const register = async (req, res, next) => {
  const { email, password, first_name, last_name, role, student_id } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ detail: "Email already registered" });
    }

    let finalStudentId = null;
    if (role === "STUDENT") {
      if (!student_id) {
        return res.status(400).json({ detail: "student_id is required for student role" });
      }
      const existingStudent = await prisma.user.findFirst({ where: { studentId: student_id } });
      if (existingStudent) {
        return res.status(400).json({ detail: "student_id already exists" });
      }
      finalStudentId = student_id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        firstName: first_name,
        lastName: last_name,
        role,
        studentId: finalStudentId
      }
    });

    if (role === "STUDENT") {
      await prisma.studentProfile.create({
        data: { userId: user.id }
      });
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      role: user.role,
      student_id: user.studentId,
      created_at: user.createdAt
    };
    return res.status(201).json(userResponse);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  const { username, email, password } = req.body;
  const loginEmail = username || email;
  try {
    const user = await prisma.user.findUnique({ where: { email: loginEmail } });
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      return res.status(401).json({ detail: "Incorrect email or password" });
    }
    const token = jwt.sign({ sub: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ access_token: token, token_type: "bearer" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login
};
