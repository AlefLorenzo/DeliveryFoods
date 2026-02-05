import { Restaurant } from "@/types";

export const MOCK_RESTAURANTS: Restaurant[] = [
    {
        id: "1",
        name: "Burger King do Sabor",
        rating: 4.8,
        deliveryTime: "25-35 min",
        deliveryFee: 5.99,
        tags: ["Hambúrgueres", "Americana", "Fast Food"],
        image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80",
        active: true,
        isOpen: true,
        products: [
            {
                id: "p1",
                name: "Cheddar Bacon Duplo",
                description: "Dois hambúrgueres smash, pão artesanal, muito cheddar e bacon crocante.",
                price: 32.90,
                image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
                category: "Hambúrgueres",
                active: true
            },
            {
                id: "p2",
                name: "Batata Crocante",
                description: "Batatas rústicas com ervas especiais.",
                price: 12.90,
                image: "https://images.unsplash.com/photo-1573080496987-a2ff7d54a029?w=800&q=80",
                category: "Acompanhamentos",
                active: true
            }
        ]
    },
    {
        id: "2",
        name: "Sushi Master",
        rating: 4.9,
        deliveryTime: "40-50 min",
        deliveryFee: 8.90,
        tags: ["Japonesa", "Sushi", "Saudável"],
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80",
        active: true,
        isOpen: true,
        products: [
            {
                id: "p3",
                name: "Combo Salmão",
                description: "12 peças de sushi e sashimi de salmão fresco.",
                price: 59.90,
                image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80",
                category: "Combos",
                active: true
            }
        ]
    },
    {
        id: "3",
        name: "Pizzaria Napolitana",
        rating: 4.7,
        deliveryTime: "30-45 min",
        deliveryFee: 0,
        tags: ["Pizzas", "Italiana"],
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
        active: true,
        isOpen: true,
        products: [
            {
                id: "p4",
                name: "Margherita Originale",
                description: "Molho de tomate, muçarela de búfala, manjericão.",
                price: 45.00,
                image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
                category: "Pizzas",
                active: true
            }
        ]
    },
    {
        id: "4",
        name: "Salada Verde Bowl",
        rating: 4.5,
        deliveryTime: "15-25 min",
        deliveryFee: 3.50,
        tags: ["Saudável", "Vegana", "Saladas"],
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        active: true,
        isOpen: true,
        products: [
            {
                id: "p5",
                name: "Caesar Supreme",
                description: "Alface americana, croutons, parmesão, molho especial.",
                price: 28.00,
                image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80",
                category: "Saladas",
                active: true
            }
        ]
    }
];
