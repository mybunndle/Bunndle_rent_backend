import { Router } from 'express';
import { register, login , getCurrentUser , changePassword} from './auth.controller.js';
import {authenticate} from '../../middleware/auth.middleware.js';


const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/get_me', authenticate, getCurrentUser);
router.put('/password_change', authenticate, changePassword);

export default router;