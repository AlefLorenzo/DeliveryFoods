import prisma from './lib/prisma';

async function checkUser() {
    const user = await prisma.user.findUnique({
        where: { email: 'cliente@teste.com' }
    });
    console.log('User found:', user ? 'YES' : 'NO');
    if (user) console.log('User ID:', user.id);
}

checkUser()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
