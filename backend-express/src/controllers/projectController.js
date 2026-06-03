const prisma = require("../config/db");

const mapProject = (p) => ({
  id: p.id,
  title: p.title,
  description: p.description,
  github_url: p.githubUrl,
  deadline: p.deadline,
  status: p.status,
  creator_id: p.creatorId,
  team_id: p.teamId,
  created_at: p.createdAt
});

const mapSprint = (s) => ({
  id: s.id,
  project_id: s.projectId,
  name: s.name,
  start_date: s.startDate,
  end_date: s.endDate,
  status: s.status
});

const getAllProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany();
    return res.json(projects.map(mapProject));
  } catch (err) {
    next(err);
  }
};

const getProjectById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({ where: { id: parseInt(id) } });
    if (!project) {
      return res.status(404).json({ detail: "Project not found" });
    }
    return res.json(mapProject(project));
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  const { title, description, github_url, deadline, status, team_id } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        githubUrl: github_url,
        deadline: deadline ? new Date(deadline) : null,
        status: status || "PLANNED",
        teamId: team_id,
        creatorId: req.user.id
      }
    });
    return res.status(201).json(mapProject(project));
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, github_url, deadline, status, team_id } = req.body;
  try {
    const project = await prisma.project.findUnique({ where: { id: parseInt(id) } });
    if (!project) {
      return res.status(404).json({ detail: "Project not found" });
    }

    const updated = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        githubUrl: github_url,
        deadline: deadline ? new Date(deadline) : null,
        status,
        teamId: team_id
      }
    });
    return res.json(mapProject(updated));
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({ where: { id: parseInt(id) } });
    if (!project) {
      return res.status(404).json({ detail: "Project not found" });
    }
    await prisma.project.delete({ where: { id: parseInt(id) } });
    return res.json({ detail: "Project deleted" });
  } catch (err) {
    next(err);
  }
};

const getSprints = async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const project = await prisma.project.findUnique({ where: { id: parseInt(projectId) } });
    if (!project) {
      return res.status(404).json({ detail: "Project not found" });
    }
    const sprints = await prisma.sprint.findMany({
      where: { projectId: parseInt(projectId) }
    });
    return res.json(sprints.map(mapSprint));
  } catch (err) {
    next(err);
  }
};

const createSprint = async (req, res, next) => {
  const { projectId } = req.params;
  const { name, start_date, end_date, status } = req.body;
  try {
    const project = await prisma.project.findUnique({ where: { id: parseInt(projectId) } });
    if (!project) {
      return res.status(404).json({ detail: "Project not found" });
    }
    const sprint = await prisma.sprint.create({
      data: {
        projectId: parseInt(projectId),
        name,
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        status: status || "PLANNED"
      }
    });
    return res.status(201).json(mapSprint(sprint));
  } catch (err) {
    next(err);
  }
};

const updateSprint = async (req, res, next) => {
  const { projectId, sprintId } = req.params;
  const { name, start_date, end_date, status } = req.body;
  try {
    const sprint = await prisma.sprint.findFirst({
      where: { id: parseInt(sprintId), projectId: parseInt(projectId) }
    });
    if (!sprint) {
      return res.status(404).json({ detail: "Sprint not found" });
    }

    const updated = await prisma.sprint.update({
      where: { id: parseInt(sprintId) },
      data: {
        name,
        startDate: start_date ? new Date(start_date) : undefined,
        endDate: end_date ? new Date(end_date) : undefined,
        status
      }
    });
    return res.json(mapSprint(updated));
  } catch (err) {
    next(err);
  }
};

const deleteSprint = async (req, res, next) => {
  const { projectId, sprintId } = req.params;
  try {
    const sprint = await prisma.sprint.findFirst({
      where: { id: parseInt(sprintId), projectId: parseInt(projectId) }
    });
    if (!sprint) {
      return res.status(404).json({ detail: "Sprint not found" });
    }
    await prisma.sprint.delete({ where: { id: parseInt(sprintId) } });
    return res.json({ detail: "Sprint deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getSprints,
  createSprint,
  updateSprint,
  deleteSprint
};
