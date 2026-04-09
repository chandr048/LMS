import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        // Note: Manual String _id is fine, but usually MongoDB handles this with ObjectId
        _id: { type: String, required: true }, 
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true }, // Added unique for better practice
        imageUrl: { type: String, required: true },
        role: { 
            type: String, 
            enum: ['student', 'instructor', 'admin'], // Optional: restricts roles to specific strings
            default: 'student' 
        },
        enrolledCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            }
        ],
    },
    { timestamps: true }
);

// FIX: Check if the model exists before creating it. 
// This prevents "OverwriteModelError" and "Missing Schema" errors.
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;