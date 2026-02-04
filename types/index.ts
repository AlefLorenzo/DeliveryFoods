export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    active: boolean;
<<<<<<< Current (Your changes)
    isNew?: boolean;
=======
    /** Para badge "NOVO" nas últimas 24h */
>>>>>>> Incoming (Background Agent changes)
    createdAt?: string;
}

export interface Restaurant {
    id: string;
    name: string;
    rating: number;
    avgTime?: string | null;
    deliveryTime?: string;
    deliveryFee: number;
    tags: string[];
    image: string;
    products: Product[];
    isOpen?: boolean;
    statusMessage?: string;
<<<<<<< Current (Your changes)
    nextOpen?: string;
    nextOpenMessage?: string;
=======
    nextOpen?: string | null;
>>>>>>> Incoming (Background Agent changes)
    active: boolean;
    restaurantType?: 'RESTAURANT' | 'LANCHONETE' | 'MISTO';
}

export interface Order {
    id: string;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED';
    restaurantId: string;
    items: { productId: string; quantity: number }[];
    total: number;
    createdAt: Date;
}

export type UserRole = 'CLIENT' | 'RESTAURANT' | 'COURIER';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: UserRole;
    address: {
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
}
