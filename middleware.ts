import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'snap-secret-2026-industrial-v1'
);

// Simulação simples de Rate Limiting em memória (recomenda-se Redis para escala real)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_THRESHOLD = 100; // 100 reqs por minuto
const RESET_INTERVAL = 60000;

async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const now = Date.now();

    // 1. Rate Limiting Industrial
    let rateData = rateLimitMap.get(ip);
    if (!rateData || (now - rateData.lastReset) > RESET_INTERVAL) {
        rateData = { count: 1, lastReset: now };
        rateLimitMap.set(ip, rateData);
    } else {
        rateData.count++;
    }

    if (rateData.count > RATE_LIMIT_THRESHOLD) {
        return new NextResponse('Too Many Requests - Rate limit exceeded', { status: 429 });
    }

    // 2. Proteção de Rotas API Protegidas
    if (request.nextUrl.pathname.startsWith('/api/protected')) {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized - Missing Token' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });
        }
    }

    // 3. Headers de Segurança Industriais (HSTS, CSP, etc)
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return response;
}

export const config = {
    matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
