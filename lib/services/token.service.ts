import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'snap-secret-2026-industrial-v1';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'snap-refresh-2026-industrial-v1';

export class TokenService {
    static generateTokens(payload: { sub: string; email: string; role: string }) {
        const accessToken = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { sub: payload.sub },
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

    static verifyAuthHeader(authHeader: string | null) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Unauthorized');
        }
        const token = authHeader.split(' ')[1];
        const decoded = this.verifyToken(token);
        if (!decoded) throw new Error('Invalid token');
        return decoded;
    }
}
