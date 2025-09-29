import Stripe from "stripe";

// Mock Stripe for development when STRIPE_SECRET_KEY is not provided
const createMockStripe = () => ({
  billingPortal: {
    sessions: {
      create: async () => ({ url: "mock://billing-portal" })
    }
  },
  checkout: {
    sessions: {
      create: async () => ({ url: "mock://checkout" })
    }
  },
  subscriptions: {
    retrieve: async () => ({
      id: "mock_sub",
      status: "active",
      customer: "mock_cus",
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [{ price: { product: "mock_prod" } }]
      }
    })
  },
  webhooks: {
    constructEvent: () => ({
      type: "checkout.session.completed",
      data: { object: {} }
    })
  }
});

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    })
  : createMockStripe() as any;
