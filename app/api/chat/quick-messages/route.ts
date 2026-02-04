import { NextResponse } from 'next/server';
import { QuickMessageService } from '@/lib/services/quick-message.service';
import { TokenService } from '@/lib/services/token.service';
import { handleApiError, AppError } from '@/lib/error-handler';

// GET /api/chat/quick-messages - Listar mensagens prontas
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);

        if (!decoded) throw new AppError('Token inválido', 401);

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let messages;

        if (category === 'COURIER_TO_CUSTOMER' || category === 'CUSTOMER_TO_COURIER') {
            messages = await QuickMessageService.getByCategory(category);
        } else {
            messages = await QuickMessageService.getAll();
        }

        return NextResponse.json(messages);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/chat/quick-messages - Criar mensagem pronta (ADMIN only)
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);

        if (!decoded) throw new AppError('Token inválido', 401);

        if (decoded.role !== 'ADMIN') {
            throw new AppError('Apenas administradores podem criar mensagens prontas', 403);
        }

        const body = await request.json();
        const { text, category, icon, order } = body;

        if (!text || !category) {
            throw new AppError('Texto e categoria são obrigatórios', 400);
        }

        const message = await QuickMessageService.create({
            text,
            category,
            icon,
            order
        });

        return NextResponse.json(message);
    } catch (error) {
        return handleApiError(error);
    }
}
