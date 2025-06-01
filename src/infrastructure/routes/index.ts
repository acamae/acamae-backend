import { Router } from 'express';
import { API_ROUTES } from '@shared/constants/apiRoutes';

const router = Router();

router.post(API_ROUTES.AUTH.LOGIN, (_req, res) => {
  res.json({ message: 'Login endpoint' });
});

router.post(API_ROUTES.AUTH.REGISTER, (_req, res) => {
  res.json({ message: 'Register endpoint' });
});

router.post(API_ROUTES.AUTH.LOGOUT, (_req, res) => {
  res.json({ message: 'Logout endpoint' });
});

router.get(API_ROUTES.AUTH.ME, (_req, res) => {
  res.json({ message: 'Current user endpoint' });
});

router.get(API_ROUTES.USERS.GET_BY_ID, (req, res) => {
  res.json({ message: `Get user with ID: ${req.params.id}` });
});

router.put(API_ROUTES.USERS.UPDATE_BY_ID, (req, res) => {
  res.json({ message: `Update user with ID: ${req.params.id}` });
});

export default router; 