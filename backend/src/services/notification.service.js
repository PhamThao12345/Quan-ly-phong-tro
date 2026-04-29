const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNotification = async ({ title, message, type = 'INFO', userId = null }) => {
  try {
    console.log(`[DEBUG] Creating notification: ${title} - ${message}`);
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId
      }
    });
    console.log(`[DEBUG] Notification created with ID: ${notification.id}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const getNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: {
      OR: [
        { userId: userId },
        { userId: null }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });
};

const markAsRead = async (id) => {
  return await prisma.notification.update({
    where: { id: Number(id) },
    data: { isRead: true }
  });
};

const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: {
      OR: [
        { userId: userId },
        { userId: null }
      ],
      isRead: false
    },
    data: { isRead: true }
  });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
};
