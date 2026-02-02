import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth.service';
import { loginSchema } from '@/lib/validations';
import { handleApiError, AppError } from '@/lib/error-handler';
import { TokenService } from '@/lib/services/token.service';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validação Industrial (Zod)
        const { email, password } = loginSchema.parse(body);

        // 2. Busca no PostgreSQL (Prisma)
        const user = await prisma.user.findUnique({
            where: { email },
            include: { details: true }
        });

        if (!user) {
            throw new AppError('Credenciais inválidas', 401);
        }

        // 3. Comparação de Hash (BCrypt)
        console.log("Checking password for user:", user.email);
        const isPasswordValid = await AuthService.comparePasswords(password, user.password);
        console.log("Password valid:", isPasswordValid);

        if (!isPasswordValid) {
            console.log("Password mismatch!");
            // Registrar log de auditoria de falha (Opcional)
            throw new AppError('Credenciais inválidas', 401);
        }

        // 4. Geração de Tokens (JWT)
        const { accessToken, refreshToken } = TokenService.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role
        });

        // 5. Resposta com Segurança (Cookies HttpOnly seriam ideais aqui)
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

        // Em produção real, o refreshToken iria em um Cookie HttpOnly
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 // 7 dias
        });

        return response;

    } catch (error) {
        console.error("LOGIN ERROR DETECTED:", error);
        return handleApiError(error);
    }
}
