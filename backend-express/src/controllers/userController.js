const prisma = require("../config/db");

const mapUser = (user) => ({
  id: user.id,
  email: user.email,
  first_name: user.firstName,
  last_name: user.lastName,
  role: user.role,
  student_id: user.studentId,
  created_at: user.createdAt
});

const getMe = async (req, res, next) => {
  return res.json(mapUser(req.user));
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    return res.json(users.map(mapUser));
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (req.user.role !== "COORDINATOR" && req.user.role !== "TEACHER" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ detail: "Not authorized" });
    }
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }
    return res.json(mapUser(user));
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { email, first_name, last_name, role, student_id } = req.body;
  try {
    if (req.user.role !== "COORDINATOR" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ detail: "Not authorized" });
    }
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    const updateData = {
      email,
      firstName: first_name,
      lastName: last_name
    };

    if (req.user.role === "COORDINATOR") {
      updateData.role = role;
      updateData.studentId = student_id || null;
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    return res.json(mapUser(updated));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  getAllUsers,
  getUserById,
  updateUser
};
