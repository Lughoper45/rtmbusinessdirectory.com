import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  {
    name: "Basic",
    description: "Access to all business deals and discounts",
    price: 99.99,
  },
  {
    name: "Premium",
    description: "Basic + early access to new deals",
    price: 149.99,
  },
  {
    name: "Pro",
    description: "Premium + affiliate earnings",
    price: 199.99,
  },
];

async function createProducts() {
  console.log("Creating Stripe products and prices...\n");

  for (const product of products) {
    // Create product
    const prod = await stripe.products.create({
      name: product.name,
      description: product.description,
    });

    // Create price (yearly)
    const price = await stripe.prices.create({
      product: prod.id,
      unit_amount: Math.round(product.price * 100),
      currency: "cad",
      recurring: { interval: "year" },
    });

    console.log(`${product.name}:`);
    console.log(`  Product ID: ${prod.id}`);
    console.log(`  Price ID:   ${price.id}`);
    console.log(`  Price:      $${product.price}/year\n`);
  }

  console.log("\nUpdate your edge function with these price IDs!");
}

createProducts().catch(console.error);
