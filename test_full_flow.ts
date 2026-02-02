import { TokenService } from './lib/services/token.service'; // Ensure this path is reachable or use fetch

async function testFullFlow() {
    console.log("🚀 Starting Full E2E Flow Test...");

    try {
        // 1. Login
        console.log("\n1. Logging in...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'cliente@teste.com', password: '123456' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const token = loginData.accessToken;
        console.log("✅ Login Success! Token obtained.");

        // 2. Get Restaurants
        console.log("\n2. Fetching Restaurants...");
        const restRes = await fetch('http://localhost:5000/api/restaurants', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const restaurants = await restRes.json();
        const activeRest = restaurants.find((r: any) => r.isOpen);

        if (!activeRest) {
            console.warn("⚠️ No open restaurants found. Using first available for structure check.");
        }
        const targetRestaurant = activeRest || restaurants[0];
        console.log(`✅ Restaurant selected: ${targetRestaurant.name} (ID: ${targetRestaurant.id})`);

        // 3. Create Order
        if (targetRestaurant.products.length > 0) {
            console.log("\n3. Creating Order...");
            const product = targetRestaurant.products[0];
            const orderPayload = {
                restaurantId: targetRestaurant.id,
                items: [{ productId: product.id, quantity: 1 }],
                paymentMethod: 'PIX'
            };

            const orderRes = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });

            if (!orderRes.ok) {
                const err = await orderRes.json();
                console.error("❌ Order Creation Failed:", JSON.stringify(err, null, 2));
            } else {
                const order = await orderRes.json();
                console.log("✅ Order Created Successfully! ID:", order.id);
            }
        } else {
            console.warn("⚠️ Selected restaurant has no products.");
        }

    } catch (error) {
        console.error("❌ Critical Failure:", error);
    }
}

testFullFlow();
