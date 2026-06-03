const prisma = require("../config/db");

const mapTask = (t) => ({
  id: t.id,
  sprint_id: t.sprintId,
  project_id: t.projectId,
  title: t.title,
  description: t.description,
  status: t.status,
  assigned_team_id: t.assignedTeamId,
  created_at: t.createdAt
});

const getAllTasks = async (req, res, next) => {
  const { project_id, sprint_id, assigned_team_id } = req.query;
  try {
    const filters = {};
    if (project_id) filters.projectId = parseInt(project_id);
    if (sprint_id) filters.sprintId = parseInt(sprint_id);
    if (assigned_team_id) filters.assignedTeamId = parseInt(assigned_team_id);

    const tasks = await prisma.task.findMany({ where: filters });
    return res.json(tasks.map(mapTask));
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      return res.status(404).json({ detail: "Task not found" });
    }
    return res.json(mapTask(task));
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  const { project_id, sprint_id, title, description, status, assigned_team_id } = req.body;
  try {
    const project = await prisma.project.findUnique({ where: { id: project_id } });
    if (!project) {
      return res.status(404).json({ detail: "Project not found" });
    }

    const task = await prisma.task.create({
      data: {
        projectId: project_id,
        sprintId: sprint_id || null,
        title,
        description,
        status: status || "TO_DO",
        assignedTeamId: assigned_team_id || null
      }
    });
    return res.status(201).json(mapTask(task));
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  const { id } = req.params;
  const { project_id, sprint_id, title, description, status, assigned_team_id } = req.body;
  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      return res.status(404).json({ detail: "Task not found" });
    }

    const updated = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        projectId: project_id,
        sprintId: sprint_id || null,
        title,
        description,
        status,
        assignedTeamId: assigned_team_id || null
      }
    });
    return res.json(mapTask(updated));
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) {
      return res.status(404).json({ detail: "Task not found" });
    }

    if (req.user.role !== "COORDINATOR" && req.user.role !== "TEACHER") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id }
      });
      if (!profile || profile.teamId !== task.assignedTeamId) {
        return res.status(403).json({ detail: "Not authorized to delete this task" });
      }
    }

    await prisma.task.delete({ where: { id: parseInt(id) } });
    return res.json({ detail: "Task deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
