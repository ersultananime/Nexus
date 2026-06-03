const { z } = require("zod");

const studentIdSchema = z.string().nullable().optional().refine(val => {
  if (!val) return true;
  return /^\d{12}$/.test(val);
}, {
  message: "student_id must be exactly 12 digits"
});

const githubUrlSchema = z.string().nullable().optional().refine(val => {
  if (!val) return true;
  return val.startsWith("https://github.com/");
}, {
  message: "github_url must start with https://github.com/"
});

const deadlineSchema = z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return arg;
}, z.date().nullable().optional().refine(val => {
  if (!val) return true;
  return val > new Date();
}, {
  message: "deadline must be in the future"
}));

const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  student_id: studentIdSchema
});

const userUpdateSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  student_id: studentIdSchema
});

const profileUpdateSchema = z.object({
  skills: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  team_id: z.number().nullable().optional()
});

const teamCreateSchema = z.object({
  name: z.string(),
  looking_for_members: z.boolean().optional().default(true),
  desired_skills: z.string().nullable().optional()
});

const projectCreateSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  github_url: githubUrlSchema,
  deadline: deadlineSchema,
  status: z.string().optional().default("PLANNED"),
  team_id: z.number().nullable().optional()
});

const sprintCreateSchema = z.object({
  name: z.string(),
  start_date: z.preprocess((arg) => new Date(arg), z.date()),
  end_date: z.preprocess((arg) => new Date(arg), z.date()),
  status: z.string().optional().default("PLANNED")
});

const taskCreateSchema = z.object({
  project_id: z.number(),
  sprint_id: z.number().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().optional().default("TO_DO"),
  assigned_team_id: z.number().nullable().optional()
});

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  req.body = result.data;
  next();
};

module.exports = {
  validateBody,
  userCreateSchema,
  userUpdateSchema,
  profileUpdateSchema,
  teamCreateSchema,
  projectCreateSchema,
  sprintCreateSchema,
  taskCreateSchema
};
