import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'snap-secret-2026-industrial-v1';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'snap-refresh-2026-industrial-v1';

export class AuthService {
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    }

    static async comparePasswords(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static generateTokens(user: Pick<User, 'id' | 'email' | 'role'>) {
        const accessToken = jwt.sign(
            { sub: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { sub: user.id },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };
    }

    static verifyToken(token: string) {
        try {
            return jwt.verify(token, JWT_SECRET) as any;
        } catch (e) {
            return null;
        }
    }

    static verifyRefreshToken(token: string) {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET) as any;
        } catch (e) {
            return null;
        }
    }
}
