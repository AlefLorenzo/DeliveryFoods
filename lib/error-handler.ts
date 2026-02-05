import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 400,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function handleApiError(error: unknown) {
    console.error('[INDUSTRIAL_LOG]:', error);

    if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.statusCode }
        );
    }

    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                error: 'Erro de validação de dados',
                details: error.issues.map(issue => ({ path: issue.path, message: issue.message }))
            },
            { status: 422 }
        );
    }

    // Erro Genérico de Produção (Segurança: não vazar stack trace)
    return NextResponse.json(
        { error: 'Ocorreu um erro interno no servidor. Nossa equipe técnica foi notificada.' },
        { status: 500 }
    );
}
