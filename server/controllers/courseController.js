import User from "../models/user.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";


// ✅ Get all courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select(['-courseContent', '-enrolledStudents'])
      .populate({ path: 'educator' });

    res.json({ success: true, courses });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


// ✅ Get course by ID
export const getCourseId = async (req, res) => {
  const { id } = req.params;

  try {

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findById(id).populate('educator');

    // ✅ Check course exists
    if (!course) {
      return res.json({ success: false, message: "Course not found" });
    }

    // ✅ Clone object (avoid mutation)
    const courseData = JSON.parse(JSON.stringify(course));

    // ✅ Hide lecture URLs
    courseData.courseContent.forEach(chapter => {
      chapter.chapterContent.forEach(lecture => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = '';
        }
      });
    });

    res.json({ success: true, course: courseData }); // ✅ FIXED KEY

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


// ✅ Get enrolled courses
export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const userData = await User.findById(userId).populate('enrolledCourses');

    // ✅ Check user exists
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      enrolledCourses: userData.enrolledCourses || []
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};