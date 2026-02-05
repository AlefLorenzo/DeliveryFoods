import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { AuditService } from './audit.service';
import { AppError } from '@/lib/error-handler';
import { checkRestaurantStatus } from './availability.service';
import { pusherServer, PUSHER_EVENTS } from '../pusher';
import { CourierEarningsService } from './courier-earnings.service';
import { ChatTripartiteService } from './chat-tripartite.service';

export interface CreateOrderOptions {
    needsChange?: boolean;
    changeFor?: number;
}

export class OrderService {
    static async createOrder(
        userId: string,
        restaurantId: string,
        items: { productId: string; quantity: number }[],
        paymentMethod: string,
        discount: number = 0,
        options: CreateOrderOptions = {}
    ) {
        const { needsChange = false, changeFor } = options;

        // 0. Validar Disponibilidade (Turno e Dia)
        const status = await checkRestaurantStatus(restaurantId);
        console.log(`Checking availability for restaurant ${restaurantId}:`, status);
        if (!status.isOpen) {
            throw new AppError(`Restaurante fechado: ${status.message}`);
        }

        // 1. Buscar todos os produtos de uma vez para evitar N+1 e timeouts
        const productIds = items.map(i => i.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { shifts: true }
        });

        return await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const orderItemsData = [];

            for (const item of items) {
                const product = products.find(p => p.id === item.productId);
                if (!product || !product.active) throw new AppError(`Produto ${item.productId} indisponível`);

                // Validação de Turno do Produto
                if (product.shifts && product.shifts.length > 0) {
                    if (!status.currentShift) {
                        throw new AppError(`O produto ${product.name} não está disponível neste horário.`);
                    }

                    const isAllowed = product.shifts.some((s: { id: string }) => s.id === status.currentShift!.id);
                    if (!isAllowed) {
                        throw new AppError(`O produto ${product.name} não está disponível no turno ${status.currentShift!.name}.`);
                    }
                }

                subtotal += product.price * item.quantity;
                orderItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                });
            }

            const restaurant = await tx.restaurant.findUnique({ where: { id: restaurantId } });
            if (!restaurant) throw new AppError('Restaurante não encontrado');

            const total = Math.max(0, subtotal + restaurant.deliveryFee - discount);
            const orderNumber = parseInt(`${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`);

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    userId,
                    restaurantId,
                    total,
                    deliveryFee: restaurant.deliveryFee,
                    discount,
                    paymentMethod,
                    status: 'PENDING',
                    needsChange,
                    changeFor: changeFor ?? null,
                    items: {
                        create: orderItemsData
                    },
                    timeline: {
                        create: { status: 'PENDING', notes: 'Pedido realizado pelo cliente.' }
                    }
                },
                include: { items: true, timeline: true, restaurant: { select: { ownerId: true } } }
            });

            return order;
        }, {
            maxWait: 5000, // Tempo máximo para obter conexão
            timeout: 15000 // Tempo máximo da transação (15s)
        }).then(async (order) => {
            // 3. Auditoria
            await AuditService.log(userId, 'CREATE_ORDER', 'Order', { orderId: order.id, total: order.total });

            // 4. Canal de chat Cliente-Restaurante (tripartite)
            try {
                const ownerId = order.restaurant?.ownerId;
                if (ownerId) {
                    await ChatTripartiteService.createCustomerRestaurantChannel(order.id, userId, ownerId);
                }
            } catch (e) {
                console.warn('[CHAT]: Falha ao criar canal cliente-restaurante', e);
            }

            // 5. Real-time via Pusher
            try {
                await pusherServer.trigger(`restaurant-${restaurantId}`, PUSHER_EVENTS.ORDER_CREATED, order);
                await pusherServer.trigger(`user-${userId}`, PUSHER_EVENTS.ORDER_CREATED, order);
            } catch (e) {
                console.warn('[PUSHER_ERROR]: Falha ao disparar evento em tempo real', e);
            }

            const { restaurant: _r, ...orderWithoutRestaurant } = order;
            return orderWithoutRestaurant;
        });
    }

    static async updateStatus(orderId: string, status: OrderStatus, userId: string, notes?: string) {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                timeline: {
                    create: { status, notes }
                }
            }
        });

        await AuditService.log(userId, 'UPDATE_ORDER_STATUS', 'Order', { orderId, status });

        // Real-time Trigger via Pusher
        try {
            await pusherServer.trigger(`order-${orderId}`, PUSHER_EVENTS.ORDER_STATUS_UPDATED, order);
            await pusherServer.trigger(`user-${order.userId}`, PUSHER_EVENTS.ORDER_STATUS_UPDATED, order);
            await pusherServer.trigger(`restaurant-${order.restaurantId}`, PUSHER_EVENTS.ORDER_STATUS_UPDATED, order);

            // Notificar entregadores se o pedido estiver pronto
            if (status === 'READY') {
                await pusherServer.trigger('courier-feed', PUSHER_EVENTS.ORDER_STATUS_UPDATED, order);
            }
        } catch (e) {
            console.warn('[PUSHER_ERROR]: Falha ao disparar atualização em tempo real', e);
        }

        return order;
    }
}
