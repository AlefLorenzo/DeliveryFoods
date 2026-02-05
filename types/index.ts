export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    active: boolean;
}

export interface Restaurant {
    id: string;
    name: string;
    rating: number;
    avgTime?: string | null;
    deliveryTime?: string; // Keep for legacy/compat if needed
    deliveryFee: number;
    tags: string[];
    image: string;
    products: Product[];
    isOpen?: boolean;
    statusMessage?: string;
    active: boolean;
    ownerId?: string;
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
