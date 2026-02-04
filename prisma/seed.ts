import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('123456', 12);

    // 1. Limpar banco (Produção segura)
    await prisma.auditLog.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.shift.deleteMany(); // Added
    await prisma.operatingDay.deleteMany(); // Added
    await prisma.restaurant.deleteMany();
    await prisma.courierStatus.deleteMany(); // Added
    await prisma.userDetail.deleteMany();
    await prisma.user.deleteMany();

    console.log('🚀 Iniciando Seed Industrial...');

    // 2. Criar Usuários Base
    await prisma.user.create({
        data: {
            name: 'João Cliente Real',
            email: 'cliente@teste.com',
            password,
            role: 'CLIENT',
            details: {
                create: {
                    street: 'Av. Paulista',
                    number: '1000',
                    neighborhood: 'Bela Vista',
                    city: 'São Paulo',
                    state: 'SP',
                    zipCode: '01310-100'
                }
            }
        }
    });

    const restaurantOwner = await prisma.user.create({
        data: {
            name: 'Admin Gourmet Burger',
            email: 'rest@teste.com',
            password,
            role: 'RESTAURANT'
        }
    });

    await prisma.user.create({
        data: {
            name: 'Carlos Entregador Pro',
            email: 'courier@teste.com',
            password,
            role: 'COURIER',
            courierStatus: {
                create: { isOnline: true }
            }
        }
    });

    // 3. Criar Restaurante e Produtos
    await prisma.restaurant.create({
        data: {
            name: 'Gourmet Burger Royale',
            description: 'Hambúrgueres artesanais premium com ingredientes selecionados.',
            ownerId: restaurantOwner.id,
            deliveryFee: 7.90,
            minOrder: 30.00,
            avgTime: '25-40',
            active: true,
            products: {
                create: [
                    { name: 'Classic Smash', price: 28.90, category: 'Burgers', description: 'Duas carnes de 90g, queijo cheddar e maionese.' },
                    { name: 'Bacon Blast', price: 34.90, category: 'Burgers', description: 'Carne 160g, muito bacon crocante e queijo gouda.' },
                    { name: 'Batata Rústica', price: 15.00, category: 'Acompanhamentos', description: 'Porção grande com alecrim e páprica.' }
                ]
            }
        }
    });

    console.log('✅ Seed Industrial Concluído!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
