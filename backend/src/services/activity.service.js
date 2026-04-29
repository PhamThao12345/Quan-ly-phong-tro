const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logActivity = async (userId, action, module = null, details = null) => {
  try {
    if (!userId) return;
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        module,
        details: details ? JSON.stringify(details) : null
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const getActivities = async (limit = 50) => {
  return await prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          role: true
        }
      }
    }
  });
};

const clearActivities = async () => {
  return await prisma.activityLog.deleteMany({});
};

module.exports = {
  logActivity,
  getActivities,
  clearActivities
};
