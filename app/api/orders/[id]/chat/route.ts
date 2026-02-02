import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/token.service';
import { ChatService } from '@/lib/services/chat.service';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const messageSchema = z.object({
    text: z.string().min(1),
    sender: z.enum(['USER', 'RESTAURANT', 'COURIER', 'SYSTEM'])
});

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const messages = await ChatService.getMessages(id);
        return NextResponse.json(messages);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get('Authorization');
        const decoded = TokenService.verifyAuthHeader(authHeader);

        const body = await req.json();
        const validated = messageSchema.parse(body);

        const message = await ChatService.sendMessage(
            id,
            decoded.sub,
            validated.text,
            validated.sender
        );

        return NextResponse.json(message);
    } catch (error) {
        return handleApiError(error);
    }
}
