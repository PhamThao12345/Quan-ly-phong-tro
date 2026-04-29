const userService = require('../services/user.service');
const activityService = require('../services/activity.service');

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Người dùng không tồn tại' });
    }
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ status: 'error', message: 'Tên đăng nhập và email là bắt buộc' });
    }

    const newUser = await userService.createUser(req.body);
    await activityService.logActivity(req.user.id, `Đã thêm người dùng mới: ${newUser.fullName || newUser.username}`, 'NGUOI_DUNG');
    res.status(201).json({ status: 'success', message: 'Thêm người dùng thành công', data: newUser });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(parseInt(req.params.id), req.body, req.user);
    await activityService.logActivity(req.user.id, `Đã cập nhật thông tin người dùng: ${updatedUser.fullName || updatedUser.username}`, 'NGUOI_DUNG');
    res.status(200).json({ status: 'success', message: 'Cập nhật thành công', data: updatedUser });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userToDelete = await userService.getUserById(parseInt(req.params.id));
    await userService.deleteUser(parseInt(req.params.id), req.user);
    await activityService.logActivity(req.user.id, `Đã xóa người dùng: ${userToDelete.fullName || userToDelete.username}`, 'NGUOI_DUNG');
    res.status(200).json({ status: 'success', message: 'Xóa người dùng thành công' });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const user = await userService.getUserById(parseInt(req.params.id));
    const result = await userService.resetPassword(parseInt(req.params.id), req.user);
    await activityService.logActivity(req.user.id, `Đã đặt lại mật khẩu cho người dùng: ${user.fullName || user.username}`, 'NGUOI_DUNG');
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) {
    res.status(error.status || 500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
};
