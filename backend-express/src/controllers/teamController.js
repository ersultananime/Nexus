const prisma = require("../config/db");

const mapTeam = (team) => ({
  id: team.id,
  name: team.name,
  looking_for_members: team.lookingForMembers,
  desired_skills: team.desiredSkills,
  created_at: team.createdAt
});

const matchTeams = async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id }
    });
    
    let studentSkills = [];
    if (profile && profile.skills) {
      studentSkills = profile.skills.split(",").map(s => s.trim().toLowerCase()).filter(s => s);
    }

    const teams = await prisma.team.findMany({
      where: { lookingForMembers: true }
    });

    const results = teams.map(team => {
      let teamSkills = [];
      if (team.desiredSkills) {
        teamSkills = team.desiredSkills.split(",").map(s => s.trim().toLowerCase()).filter(s => s);
      }
      
      const matches = studentSkills.filter(s => teamSkills.includes(s));
      return {
        id: team.id,
        name: team.name,
        looking_for_members: team.lookingForMembers,
        desired_skills: team.desiredSkills,
        created_at: team.createdAt,
        match_score: matches.length,
        matched_skills: matches.join(",")
      };
    });

    results.sort((a, b) => b.match_score - a.match_score);
    return res.json(results);
  } catch (err) {
    next(err);
  }
};

const getAllTeams = async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany();
    return res.json(teams.map(mapTeam));
  } catch (err) {
    next(err);
  }
};

const getTeamById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const team = await prisma.team.findUnique({ where: { id: parseInt(id) } });
    if (!team) {
      return res.status(404).json({ detail: "Team not found" });
    }
    return res.json(mapTeam(team));
  } catch (err) {
    next(err);
  }
};

const createTeam = async (req, res, next) => {
  const { name, looking_for_members, desired_skills } = req.body;
  try {
    const existing = await prisma.team.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ detail: "Team name already exists" });
    }
    const team = await prisma.team.create({
      data: {
        name,
        lookingForMembers: looking_for_members !== undefined ? looking_for_members : true,
        desiredSkills: desired_skills
      }
    });
    return res.status(201).json(mapTeam(team));
  } catch (err) {
    next(err);
  }
};

const updateTeam = async (req, res, next) => {
  const { id } = req.params;
  const { name, looking_for_members, desired_skills } = req.body;
  try {
    const team = await prisma.team.findUnique({ where: { id: parseInt(id) } });
    if (!team) {
      return res.status(404).json({ detail: "Team not found" });
    }

    if (req.user.role !== "COORDINATOR" && req.user.role !== "TEACHER") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id }
      });
      if (!profile || profile.teamId !== parseInt(id)) {
        return res.status(403).json({ detail: "Not authorized to edit this team" });
      }
    }

    const updated = await prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        name,
        lookingForMembers: looking_for_members,
        desiredSkills: desired_skills
      }
    });
    return res.json(mapTeam(updated));
  } catch (err) {
    next(err);
  }
};

const deleteTeam = async (req, res, next) => {
  const { id } = req.params;
  try {
    const team = await prisma.team.findUnique({ where: { id: parseInt(id) } });
    if (!team) {
      return res.status(404).json({ detail: "Team not found" });
    }
    await prisma.team.delete({ where: { id: parseInt(id) } });
    return res.json({ detail: "Team deleted" });
  } catch (err) {
    next(err);
  }
};

const joinTeam = async (req, res, next) => {
  const { id } = req.params;
  try {
    const team = await prisma.team.findUnique({ where: { id: parseInt(id) } });
    if (!team) {
      return res.status(404).json({ detail: "Team not found" });
    }
    if (!team.lookingForMembers) {
      return res.status(400).json({ detail: "Team is not looking for members" });
    }

    let profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile) {
      await prisma.studentProfile.create({
        data: { userId: req.user.id, teamId: parseInt(id) }
      });
    } else {
      await prisma.studentProfile.update({
        where: { userId: req.user.id },
        data: { teamId: parseInt(id) }
      });
    }
    return res.json({ detail: "Joined team successfully" });
  } catch (err) {
    next(err);
  }
};

const leaveTeam = async (req, res, next) => {
  const { id } = req.params;
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id }
    });
    if (!profile || profile.teamId !== parseInt(id)) {
      return res.status(400).json({ detail: "You are not a member of this team" });
    }

    await prisma.studentProfile.update({
      where: { userId: req.user.id },
      data: { teamId: null }
    });
    return res.json({ detail: "Left team successfully" });
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  const { id, userId } = req.params;
  try {
    const team = await prisma.team.findUnique({ where: { id: parseInt(id) } });
    if (!team) {
      return res.status(404).json({ detail: "Team not found" });
    }
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: parseInt(userId) }
    });
    if (!profile) {
      return res.status(404).json({ detail: "Student profile not found" });
    }

    await prisma.studentProfile.update({
      where: { userId: parseInt(userId) },
      data: { teamId: parseInt(id) }
    });
    return res.json({ detail: "Member added successfully" });
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  const { id, userId } = req.params;
  try {
    const profile = await prisma.studentProfile.findFirst({
      where: { userId: parseInt(userId), teamId: parseInt(id) }
    });
    if (!profile) {
      return res.status(404).json({ detail: "Student is not in this team" });
    }

    await prisma.studentProfile.update({
      where: { userId: parseInt(userId) },
      data: { teamId: null }
    });
    return res.json({ detail: "Member removed successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  matchTeams,
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  addMember,
  removeMember
};
