import { NextResponse } from 'next/server';
import { ChatTripartiteService, ChannelType } from '@/lib/services/chat-tripartite.service';
import { TokenService } from '@/lib/services/token.service';
import { handleApiError, AppError } from '@/lib/error-handler';

const CHAT_RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const chatRateMap = new Map<string, { count: number; resetAt: number }>();

function checkChatRateLimit(userId: string): void {
    const now = Date.now();
    let entry = chatRateMap.get(userId);
    if (!entry || now >= entry.resetAt) {
        entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
        chatRateMap.set(userId, entry);
    }
    entry.count++;
    if (entry.count > CHAT_RATE_LIMIT) {
        throw new AppError(`Limite de ${CHAT_RATE_LIMIT} mensagens por minuto. Tente em breve.`, 429);
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
