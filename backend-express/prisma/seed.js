const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash("password", 10);

  const coordinator = await prisma.user.create({
    data: {
      email: "coordinator@example.com",
      hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "COORDINATOR"
    }
  });

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@example.com",
      hashedPassword,
      firstName: "Professor",
      lastName: "Snape",
      role: "TEACHER"
    }
  });

  const s1 = await prisma.user.create({
    data: {
      email: "student1@example.com",
      hashedPassword,
      firstName: "Harry",
      lastName: "Potter",
      role: "STUDENT",
      studentId: "123456789012"
    }
  });

  const s2 = await prisma.user.create({
    data: {
      email: "student2@example.com",
      hashedPassword,
      firstName: "Hermione",
      lastName: "Granger",
      role: "STUDENT",
      studentId: "223456789012"
    }
  });

  const s3 = await prisma.user.create({
    data: {
      email: "student3@example.com",
      hashedPassword,
      firstName: "Ron",
      lastName: "Weasley",
      role: "STUDENT",
      studentId: "323456789012"
    }
  });

  const team = await prisma.team.create({
    data: {
      name: "Gryffindor Coders",
      lookingForMembers: true,
      desiredSkills: "Python, JS, React"
    }
  });

  await prisma.studentProfile.create({
    data: {
      userId: s1.id,
      skills: "Python, SQL, Magic",
      bio: "Boy wizard",
      teamId: team.id
    }
  });

  await prisma.studentProfile.create({
    data: {
      userId: s2.id,
      skills: "Python, JS, React, SQL, Research",
      bio: "Brightest witch of her age",
      teamId: team.id
    }
  });

  await prisma.studentProfile.create({
    data: {
      userId: s3.id,
      skills: "Java, HTML",
      bio: "Chess master",
      teamId: null
    }
  });

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  const project = await prisma.project.create({
    data: {
      title: "Hogwarts CRM",
      description: "CRM for managing spells and students",
      githubUrl: "https://github.com/hogwarts/crm",
      deadline,
      status: "ACTIVE",
      creatorId: teacher.id,
      teamId: team.id
    }
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 5);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 5);

  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 1 - Authentication",
      startDate,
      endDate,
      status: "ACTIVE"
    }
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      sprintId: sprint.id,
      title: "Database Setup",
      description: "Set up SQLAlchemy and base tables",
      status: "DONE",
      assignedTeamId: team.id
    }
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      sprintId: sprint.id,
      title: "Auth Endpoints",
      description: "Implement register and login endpoints",
      status: "IN_PROGRESS",
      assignedTeamId: team.id
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
