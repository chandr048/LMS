import { clerkClient, getAuth } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import Purchase from "../models/Purchase.js";
import User from "../models/user.js";

// update role to educator
export const updateRoleToEducator = async (req,res) => {
    try{
        const auth = getAuth(req);
        const userId = req.auth.userId;

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
export const addCourse = async (req,res) => {
    try {
         const {courseData} = req.body;
         const imageFile = req.file;
         const educatorId = req.auth.userId;

         if(!imageFile) {
            return res.status(400).json({success: false, message: 'Course thumbnail is not attached'});
         }

         if(!educatorId) {
            return res.status(401).json({success: false, message: 'Authentication required. Please log in as an educator.'});
         }

          const parsedCourseData = await JSON.parse(courseData)
          parsedCourseData.educator = educatorId;
          const newCourse = await Course.create(parsedCourseData);
          const imageUpload = await cloudinary.uploader.upload(imageFile.path)
          newCourse.courseThumbnail = imageUpload.secure_url;
          await newCourse.save();

          res.json({success: true, message: 'Course added successfully'});

    } catch(error) {
         res.status(400).json({success: false, message: error.message});
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
export const getEnrolledStudentsData = async (req,res) => {
    try{
        const educator = req.auth.userId;
        const courses = await Course.find({educator});
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
         }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle'); // Populate user and course details

         const enrolledStudents = purchases.map(purchase => ({
            student : purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
         }));

         res.json({success: true, enrolledStudents});

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}
