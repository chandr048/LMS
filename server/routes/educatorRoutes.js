import express from 'express';
import {
  addCourse,
  educatorDashboardData,
  getEnrolledStudentsData,
  getEducatorCourses,
  updateRoleToEducator,
} from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { protectEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router();

// Role update
educatorRouter.post('/update-role', protectEducator, updateRoleToEducator);

// ✅ FIXED (thumbnail instead of image)
educatorRouter.post(
  '/add-course',
  upload.single('courseThumbnail'),
  protectEducator,
  addCourse
);

educatorRouter.get('/courses', protectEducator, getEducatorCourses);
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData);
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData);

export default educatorRouter;