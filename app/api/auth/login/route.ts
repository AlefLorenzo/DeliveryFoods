import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth.service';
import { loginSchema } from '@/lib/validations';
import { handleApiError, AppError } from '@/lib/error-handler';
import { TokenService } from '@/lib/services/token.service';

// Usuários demo para quando o banco não está disponível
const DEMO_USERS = [
    { id: 'demo-client-1', name: 'Cliente Demo', email: 'cliente@demo.com', password: 'demo123', role: 'CLIENT' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cliente' },
    { id: 'demo-restaurant-1', name: 'Restaurante Demo', email: 'restaurante@demo.com', password: 'demo123', role: 'RESTAURANT' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=restaurante' },
    { id: 'demo-courier-1', name: 'Entregador Demo', email: 'entregador@demo.com', password: 'demo123', role: 'COURIER' as const, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=entregador' },
];

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validação Industrial (Zod)
        const { email, password } = loginSchema.parse(body);

        // Tentar buscar no banco de dados primeiro
        try {
            // 2. Busca no PostgreSQL (Prisma)
            const user = await prisma.user.findUnique({
                where: { email },
                include: { details: true }
            });

            if (!user) {
                throw new AppError('Credenciais inválidas', 401);
            }

            // 3. Comparação de Hash (BCrypt)
            const isPasswordValid = await AuthService.comparePasswords(password, user.password);

            if (!isPasswordValid) {
                throw new AppError('Credenciais inválidas', 401);
            }

            // 4. Geração de Tokens (JWT)
            const { accessToken, refreshToken } = TokenService.generateTokens({
                sub: user.id,
                email: user.email,
                role: user.role
            });

            // 5. Resposta com Segurança
            const response = NextResponse.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    address: user.details ? {
                        street: user.details.street,
                        number: user.details.number,
                        neighborhood: user.details.neighborhood,
                        city: user.details.city,
                        state: user.details.state,
                        zipCode: user.details.zipCode,
                    } : null
                },
                accessToken
            });

            response.cookies.set('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60
            });

            return response;
        } catch (dbError) {
            // Fallback para usuários demo quando banco não está disponível
            console.warn("Database unavailable, trying demo users:", dbError);
            
            const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
            
            if (!demoUser) {
                throw new AppError('Credenciais inválidas. Use: cliente@demo.com / demo123', 401);
            }

            const { accessToken, refreshToken } = TokenService.generateTokens({
                sub: demoUser.id,
                email: demoUser.email,
                role: demoUser.role
            });

            const response = NextResponse.json({
                user: {
                    id: demoUser.id,
                    name: demoUser.name,
                    email: demoUser.email,
                    role: demoUser.role,
                    avatar: demoUser.avatar,
                    address: {
                        street: 'Rua Demo',
                        number: '123',
                        neighborhood: 'Centro',
                        city: 'São Paulo',
                        state: 'SP',
                        zipCode: '01000-000',
                    }
                },
                accessToken
            });

            response.cookies.set('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60
            });

            return response;
        }

    } catch (error) {
        console.error("LOGIN ERROR DETECTED:", error);
        return handleApiError(error);
    }
}
