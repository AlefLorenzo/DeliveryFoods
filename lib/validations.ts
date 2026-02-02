import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
    name: z.string().min(3, 'Nome muito curto'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    role: z.enum(['CLIENT', 'RESTAURANT', 'COURIER']),
    phone: z.string().optional(),
});

export const orderSchema = z.object({
    restaurantId: z.string(),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
    })).min(1, 'O pedido deve ter pelo menos um item'),
    paymentMethod: z.enum(['STRIPE', 'PIX', 'CARD_ON_DELIVERY']),
    discount: z.number().optional(),
    needsChange: z.boolean().optional(),
    changeFor: z.number().optional(),
});

export const restaurantSchema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    deliveryFee: z.number().nonnegative(),
    minOrder: z.number().nonnegative(),
    avgTime: z.string(),
});
