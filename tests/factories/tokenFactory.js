import { v4 as uuidv4 } from 'uuid';

export const makeVerificationToken = () => uuidv4();

export const makeResetToken = () => uuidv4();
