import { z } from 'zod'

export const createOrderSchema = z.object({
  plan: z.enum(['PRO'])
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.enum(['PRO'])
})

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
