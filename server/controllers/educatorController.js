import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import Purchase from "../models/Purchase.js";
import User from "../models/user.js";


// update role to educator
export const updateRoleToEducator = async (req,res) => {
    try{
        const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role: 'educator' }
        });

        res.json({success: true, message: 'You can publish a course now'});

    } catch(error) {
        console.error('[ERROR]', error.message);
        res.status(400).json({success: false, message: error.message});

    }
}

//Add new course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body;
        const imageFile = req.file;
        const educatorId = req.auth.userId;

        // Better Security: Check Clerk metadata for role
        const user = await clerkClient.users.getUser(educatorId);
        if (user.publicMetadata.role !== 'educator') {
            return res.status(403).json({ success: false, message: 'Unauthorized. Educator role required.' });
        }

        if (!imageFile) {
            return res.status(400).json({ success: false, message: 'Course thumbnail is required' });
        }

        // Standard parsing (remove await)
        const parsedCourseData = JSON.parse(courseData);
        parsedCourseData.educator = educatorId;

        // Upload to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path);
        parsedCourseData.courseThumbnail = imageUpload.secure_url;

        const newCourse = await Course.create(parsedCourseData);

        res.json({ success: true, message: 'Course added successfully', course: newCourse });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
//Get educator courses
export const getEducatorCourses = async (req,res) => {
    try{
        const educator = req.auth.userId;

        const courses = await Course.find({educator})
        res.json({success: true, courses});

}catch (error){
    res.json({success: false, message: error.message});
}

}

//Get educator dashboard data
export const educatorDashboardData = async (req,res) => {
    try{
        const educator = req.auth.userId;
        const courses = await Course.find({educator});
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        //Calculate total earnings from purchases
        const purchase = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
         });

         const totalEarnings = purchase.reduce((sum, purchase) => sum + purchase.amount, 0);

        // Collect unique enrolled students across all courses
        const enrolledStudentsData = [];
        for (const course of courses){
            const students =  await User.find({
                _id: { $in: course.enrolledStudents}
            }, 'name imageUrl'); // Fetch only name and imageUrl

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.title,
                    student
                });
            });
        }

        res.json({success: true, dashboard:{
            totalEarnings,
            totalCourses,
            enrolledStudentsData
        }})

    } catch (error){
        res.json({success: false, message: error.message});
    }
}

// Get enrolled Students Data with purchase Data
// Get enrolled Students Data with purchase Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        // 1. Fetch courses to get the IDs
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        // 2. Fix: Populate 'title' (assuming your Model uses 'title' and not 'courseTitle')
        // Also added .lean() for better performance during mapping
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
        .populate('userId', 'name imageUrl')
        .populate('courseId', 'title'); 

        // 3. Fix: Add optional chaining (?.) to prevent crashing if a record is missing
        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId?.title || "Course Deleted", 
            purchaseDate: purchase.createdAt
        }));

        res.json({ success: true, enrolledStudents });

    } catch (error) {
        // Log the actual error to your terminal so you can see the stack trace
        console.error("Enrolled Students Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}
