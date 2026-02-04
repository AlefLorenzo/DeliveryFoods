import { NextResponse } from 'next/server';
import { ChatTripartiteService } from '@/lib/services/chat-tripartite.service';
import { TokenService } from '@/lib/services/token.service';
import { handleApiError, AppError } from '@/lib/error-handler';

type ChannelType = 'CUSTOMER_RESTAURANT' | 'CUSTOMER_COURIER' | 'RESTAURANT_COURIER';

// Rate limit: 10 mensagens/minuto por usuário (especificação)
const chatRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const CHAT_RATE_LIMIT = 10;
const CHAT_RATE_WINDOW_MS = 60_000;

function checkChatRateLimit(userId: string): void {
    const now = Date.now();
    const entry = chatRateLimitMap.get(userId);
    if (!entry) {
        chatRateLimitMap.set(userId, { count: 1, resetAt: now + CHAT_RATE_WINDOW_MS });
        return;
    }
    if (now > entry.resetAt) {
        chatRateLimitMap.set(userId, { count: 1, resetAt: now + CHAT_RATE_WINDOW_MS });
        return;
    }
    entry.count++;
    if (entry.count > CHAT_RATE_LIMIT) {
        throw new AppError(`Limite de mensagens atingido. Tente novamente em ${Math.ceil((entry.resetAt - now) / 1000)}s.`, 429);
    }
}

// GET /api/chat/[orderId]/[channelType] - Buscar mensagens
export async function GET(
    request: Request,
    { params }: { params: { orderId: string; channelType: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);

        if (!decoded) throw new AppError('Token inválido', 401);

        const messages = await ChatTripartiteService.getMessages(
            params.orderId,
            params.channelType as ChannelType,
            decoded.sub as string
        );

        return NextResponse.json(messages);
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/chat/[orderId]/[channelType] - Enviar mensagem
export async function POST(
    request: Request,
    { params }: { params: { orderId: string; channelType: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) throw new AppError('Não autorizado', 401);

        const token = authHeader.split(' ')[1];
        const decoded = TokenService.verifyToken(token);

        if (!decoded) throw new AppError('Token inválido', 401);

        const body = await request.json();
        const { text, isTemplate, templateId } = body;

        if (!text || text.trim().length === 0) {
            throw new AppError('Mensagem vazia', 400);
        }

        checkChatRateLimit(decoded.sub as string);

        // Validação: Cliente-Entregador só aceita templates
        if (params.channelType === 'CUSTOMER_COURIER' && !isTemplate) {
            throw new AppError('Apenas mensagens prontas são permitidas neste canal', 400);
        }

        const message = await ChatTripartiteService.sendMessage({
            orderId: params.orderId,
            channelType: params.channelType as ChannelType,
            senderId: decoded.sub as string,
            text,
            isTemplate,
            templateId
        });

        return NextResponse.json(message);
    } catch (error) {
        return handleApiError(error);
    }
}
