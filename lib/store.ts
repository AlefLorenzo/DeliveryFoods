import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Restaurant, User } from '@/types';
import { MOCK_RESTAURANTS } from './data';

export interface CartItem extends Product {
    quantity: number;
    restaurantId: string;
}

interface CartState {
    items: CartItem[];
    restaurant: Restaurant | null;
    addToCart: (product: Product, restaurant: Restaurant) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
}

export interface Order {
    id: string;
    items: Array<{
        id: string;
        quantity: number;
        price: number;
        product?: { name: string; image: string };
    }>;
    total: number;
    status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
    restaurantId: string;
    restaurantName: string;
    restaurant?: { name: string; image: string; deliveryFee?: number };
    user?: { name: string; phone: string; details?: Record<string, unknown> };
    createdAt: string;
}

interface OrderState {
    orders: Order[];
    placeOrder: (cart: { items: CartItem[], totalPrice: () => number, restaurant: Restaurant | null, clearCart: () => void }, discount?: number) => string;
    updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

interface AdminState {
    restaurants: Restaurant[];
    addRestaurant: (restaurant: Restaurant) => void;
    updateRestaurant: (restaurant: Restaurant) => void;
    deleteRestaurant: (id: string) => void;
    addProduct: (restaurantId: string, product: Product) => void;
    updateProduct: (restaurantId: string, product: Product) => void;
    deleteProduct: (restaurantId: string, productId: string) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            restaurant: null,

            addToCart: (product, restaurant) => {
                const currentRestaurant = get().restaurant;

                if (currentRestaurant && currentRestaurant.id !== restaurant.id) {
                    if (!confirm("Deseja iniciar um novo carrinho? Adicionar itens de um novo restaurante limpará seu carrinho atual.")) {
                        return;
                    }
                    set({ items: [], restaurant: null });
                }

                set((state) => {
                    const existingItem = state.items.find((item) => item.id === product.id);
                    let newItems;

                    if (existingItem) {
                        newItems = state.items.map((item) =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        );
                    } else {
                        newItems = [...state.items, { ...product, quantity: 1, restaurantId: restaurant.id }];
                    }

                    return { items: newItems, restaurant };
                });
            },

            updateQuantity: (productId, quantity) => {
                set((state) => {
                    if (quantity <= 0) {
                        const newItems = state.items.filter((item) => item.id !== productId);
                        return {
                            items: newItems,
                            restaurant: newItems.length === 0 ? null : state.restaurant
                        };
                    }

                    const newItems = state.items.map((item) =>
                        item.id === productId ? { ...item, quantity } : item
                    );
                    return { items: newItems };
                });
            },

            removeFromCart: (productId) => {
                set((state) => {
                    const newItems = state.items.filter((item) => item.id !== productId);
                    return {
                        items: newItems,
                        restaurant: newItems.length === 0 ? null : state.restaurant
                    };
                });
            },

            clearCart: () => set({ items: [], restaurant: null }),

            totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),

            totalPrice: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        }),
        { name: 'cart-storage' }
    )
);

export const useOrderStore = create<OrderState>()(
    persist(
        (set) => ({
            orders: [],
            placeOrder: (cart, discount = 0) => {
                const newOrder: Order = {
                    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
                    items: [...cart.items],
                    total: Math.max(0, cart.totalPrice() + (cart.restaurant?.deliveryFee || 0) - discount),
                    status: 'PENDING',
                    restaurantId: cart.restaurant!.id,
                    restaurantName: cart.restaurant!.name,
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({ orders: [newOrder, ...state.orders] }));
                cart.clearCart();
                return newOrder.id;
            },
            updateOrderStatus: (orderId, status) => {
                set((state) => ({
                    orders: state.orders.map((o) => o.id === orderId ? { ...o, status } : o)
                }));
            }
        }),
        { name: 'order-storage' }
    )
);

export const useAdminStore = create<AdminState>()(
    persist(
        (set) => ({
            restaurants: MOCK_RESTAURANTS,

            addRestaurant: (restaurant) => set((state) => ({
                restaurants: [...state.restaurants, restaurant]
            })),

            updateRestaurant: (restaurant) => set((state) => ({
                restaurants: state.restaurants.map(r => r.id === restaurant.id ? restaurant : r)
            })),

            deleteRestaurant: (id) => set((state) => ({
                restaurants: state.restaurants.filter(r => r.id !== id)
            })),

            addProduct: (restaurantId, product) => set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r.id === restaurantId) {
                        return { ...r, products: [...r.products, product] };
                    }
                    return r;
                })
            })),

            updateProduct: (restaurantId, product) => set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r.id === restaurantId) {
                        return {
                            ...r,
                            products: r.products.map(p => p.id === product.id ? product : p)
                        };
                    }
                    return r;
                })
            })),

            deleteProduct: (restaurantId, productId) => set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r.id === restaurantId) {
                        return {
                            ...r,
                            products: r.products.filter(p => p.id !== productId)
                        };
                    }
                    return r;
                })
            }))
        }),
        { name: 'admin-storage' }
    )
);

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    hasHydrated: boolean;
    favorites: string[]; // Restaurant IDs
    setHasHydrated: (state: boolean) => void;
    coupons: { code: string; discount: number; description: string }[];
    accessToken: string | null;
    login: (user: User, accessToken: string) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    toggleFavorite: (restaurantId: string) => void;
    addCoupon: (coupon: { code: string; discount: number; description: string }) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            hasHydrated: false,
            favorites: [],
            coupons: [
                { code: "PRIMEIRO10", discount: 10, description: "R$10 de desconto na sua primeira compra" },
                { code: "FRETEGRATIS", discount: 0, description: "Frete grátis em todos os pedidos" }
            ],
            accessToken: null as string | null,
            setHasHydrated: (state) => set({ hasHydrated: state }),
            login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
            logout: () => {
                set({ user: null, accessToken: null, isAuthenticated: false, favorites: [] });
                localStorage.removeItem('auth-storage');
                // Remover o cookie de refreshToken
                document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.href = '/login';
            },
            updateUser: (user) => set({ user }),
            toggleFavorite: (id) => set((state) => ({
                favorites: state.favorites.includes(id)
                    ? state.favorites.filter(fid => fid !== id)
                    : [...state.favorites, id]
            })),
            addCoupon: (coupon) => set((state) => ({
                coupons: [...state.coupons, coupon]
            }))
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: (state) => {
                return (rehydratedState) => {
                    if (rehydratedState) {
                        rehydratedState.setHasHydrated(true);
                    }
                }
            }
        }
    )
);

interface ThemeState {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'light', // Root will be overridden by persist or system detection
            toggleTheme: () => set((state) => ({
                theme: state.theme === 'light' ? 'dark' : 'light'
            })),
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: (state) => {
                return (rehydratedState) => {
                    if (typeof window !== 'undefined' && rehydratedState && !localStorage.getItem('theme-storage')) {
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        rehydratedState.theme = prefersDark ? 'dark' : 'light';
                    }
                }
            }
        }
    )
);

interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (message: string, type: Notification['type']) => void;
    removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    addNotification: (message, type) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            notifications: [...state.notifications, { id, message, type }]
        }));
        setTimeout(() => {
            set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            }));
        }, 3000);
    },
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    }))
}));
