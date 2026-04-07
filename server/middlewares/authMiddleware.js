import { clerkClient } from "@clerk/express";

//Middleware (Protect Educators Routes)
const protectEducator = async (req,res,next) => {
    try{
        const userId = req.auth?.userId;
        
        if(!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
        }
        
        const response = await clerkClient.users.getUser(userId)

        if(response.publicMetadata?.role !== 'educator') {
            return res.status(403).json({ success: false, message: 'Unauthorized access. Only educators can access this.' });
        }

        next();
        
    }catch(error) {
        res.status(401).json({ success: false, message: error.message });
    }
}

export { protectEducator };