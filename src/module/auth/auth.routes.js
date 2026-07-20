import { Router } from 'express';
import { 
    register, 
    login , 
    getCurrentUser , 
    changePassword , 
    updateProfile  ,
    forgotPassword ,
    verifyResetOtp ,
    resetPassword ,
} 
from './auth.controller.js';
import {authenticate} from '../../middleware/auth.middleware.js';


const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/get_me', authenticate, getCurrentUser);
router.put('/password_change', authenticate, changePassword);
router.put('/update_profile', authenticate, updateProfile);
router.post('/forgot_password',forgotPassword);
router.post('/verify_reset_otp', verifyResetOtp); 
 router.post('/reset_password', resetPassword);



export default router;