import type { FastifyReply, FastifyRequest } from 'fastify'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { env } from '../../config/env.js'
import { usersService } from '../users/users.service.js'
import type { CreateOrderInput, VerifyPaymentInput } from './payments.schema.js'
import { AppError } from '../../lib/errors.js'

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID || 'dummy',
  key_secret: env.RAZORPAY_KEY_SECRET || 'dummy'
})

export const createOrderHandler = async (
  request: FastifyRequest<{ Body: CreateOrderInput }>,
  reply: FastifyReply
) => {
  const { plan } = request.body
  
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(500, 'Razorpay is not configured on the server.', 'PAYMENT_CONFIG_ERROR')
  }

  // 1200 INR = 120000 paise
  const amount = plan === 'PRO' ? 120000 : 0
  
  if (amount === 0) {
    throw new AppError(400, 'Invalid plan for payment.', 'INVALID_PLAN')
  }

  const userId = Number(request.user!.id)
  if (isNaN(userId)) {
    throw new AppError(400, 'Invalid user ID', 'INVALID_USER_ID')
  }

  const options = {
    amount,
    currency: 'INR',
    receipt: `receipt_${userId}_${Date.now()}`
  }

  try {
    const order = await razorpay.orders.create(options)
    return reply.send(order)
  } catch (error: any) {
    request.log.error(error)
    throw new AppError(500, 'Failed to create Razorpay order', 'ORDER_CREATION_FAILED')
  }
}

export const verifyPaymentHandler = async (
  request: FastifyRequest<{ Body: VerifyPaymentInput }>,
  reply: FastifyReply
) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = request.body
  
  const secret = env.RAZORPAY_KEY_SECRET || ''

  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
    
  const isAuthentic = expectedSignature === razorpay_signature

  if (isAuthentic) {
    const userId = Number(request.user!.id)
    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID', 'INVALID_USER_ID')
    }
    const updatedUser = await usersService.updateProfile(userId, { plan })
    return reply.send({ success: true, user: updatedUser })
  } else {
    throw new AppError(400, 'Invalid payment signature', 'PAYMENT_VERIFICATION_FAILED')
  }
}
