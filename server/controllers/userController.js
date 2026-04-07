import User from '../models/user.js';
import {Purchase} from '../models/Purchase.js';
import Stripe from 'stripe';
import Purchase from '../models/Purchase.js';
import Course from '../models/Course.js';

export const getUserData = async (req,res) => {
    try{
        const userId = req.auth.userId;
        const user = await User.findById(userId)

        if(!user){
            return res.json({success: false, message: 'User not found'});
        }

        res.json({success: true, user});
    } catch (error){
        res.json({success: false, message: 'Error fetching user data'});
    }
}


export const purchaseCourse = async (req,res) => {
     try{
         const {courseId} = req.body;
         const {origin} = req.headers;
         const userId = req.auth.userId;
         const userData = await User.findById(userId)
         const courseData = await Course.findById(courseId)

         if(!userData || !courseData){
            return res.json({success: false, message: 'Data not found'});
         }

         const  purchaseData = {
            courseId: courseData._id,
            userId: userData._id,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(),
         }

         const newPurchase = await Purchase.create(purchaseData);

         //Stripe payment intent
         const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

         const currency = process.env.CURRENCY.toLowerCase();

         // Create a payment intent with the purchase amount and currency
         const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle,
            },

            unit_amount: Math.floor(newPurchase.amount * 100), // Convert to cents
        },

        quantity: 1,
     }];

     const session = await stripeInstance.checkout.sessions.create({
        success_url: `${origin}/loading/my-enrollments`,
        cancel_url: `${origin}/`,
        line_items: line_items,
        mode: 'payment',
        metadata: {
            purchaseId: newPurchase._id.toString(),
        }
     })
        res.json({success: true, url: session.url});


     } catch (error){
        res.json({success: false, message: error.message});
     }
}

