const prisma = require("../config/db");

const mapProfile = (profile) => ({
  id: profile.id,
  user_id: profile.userId,
  skills: profile.skills,
  bio: profile.bio,
  team_id: profile.teamId
});

const getProfileMe = async (req, res, next) => {
  try {
    let profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: { userId: req.user.id }
      });
    }
    return res.json(mapProfile(profile));
  } catch (err) {
    next(err);
  }
};

const updateProfileMe = async (req, res, next) => {
  const { skills, bio, team_id } = req.body;
  try {
    let profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id }
    });
    const updateData = { skills, bio };
    if (req.user.role === "COORDINATOR" && team_id !== undefined) {
      updateData.teamId = team_id;
    }
    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: { userId: req.user.id, ...updateData }
      });
    } else {
      profile = await prisma.studentProfile.update({
        where: { userId: req.user.id },
        data: updateData
      });
    }
    return res.json(mapProfile(profile));
  } catch (err) {
    next(err);
  }
};

const getAllProfiles = async (req, res, next) => {
  try {
    const profiles = await prisma.studentProfile.findMany();
    return res.json(profiles.map(mapProfile));
  } catch (err) {
    next(err);
  }
};

const getProfileById = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: parseInt(userId) }
    });
    if (!profile) {
      return res.status(404).json({ detail: "Profile not found" });
    }
    return res.json(mapProfile(profile));
  } catch (err) {
    next(err);
  }
};

const updateProfileById = async (req, res, next) => {
  const { userId } = req.params;
  const { skills, bio, team_id } = req.body;
  try {
    if (req.user.role !== "COORDINATOR" && req.user.role !== "TEACHER" && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ detail: "Not authorized" });
    }
    let profile = await prisma.studentProfile.findUnique({
      where: { userId: parseInt(userId) }
    });
    const data = { skills, bio };
    if (req.user.role === "COORDINATOR" || req.user.role === "TEACHER") {
      data.teamId = team_id !== undefined ? team_id : null;
    }
    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: { userId: parseInt(userId), ...data }
      });
    } else {
      profile = await prisma.studentProfile.update({
        where: { userId: parseInt(userId) },
        data
      });
    }
    return res.json(mapProfile(profile));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfileMe,
  updateProfileMe,
  getAllProfiles,
  getProfileById,
  updateProfileById
};
