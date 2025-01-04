import { storeToRefs } from 'pinia'

import { RazorpayProduct } from '@/types'

import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import { useFetch } from '@/composables/useFetch'

const SUBSCRIPTION_ID = 'sub_PaJqYGkwVUCNKv'
export async function initiatePayment(product: RazorpayProduct, subscribe: boolean = false) {
  try {
    const userStore = useUserStore()
    const { userDetails } = storeToRefs(userStore)

    if (subscribe) {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        name: 'Visual AI',
        subscription_id: SUBSCRIPTION_ID,
        description: product.description,
        notes: {
          userId: userDetails.value?.userId,
          credits: product.credits,
          subscribe,
          subscriptionId: SUBSCRIPTION_ID
        },
        handler: function (response: any) {
          console.log('response', response)
        }
      }

      // @ts-ignore
      const rzp = new Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        console.error(response) // Handle payment failure
      })
      rzp.open()
    } else {
      const order = await createOrder(product)
      if (order) {
        const { amount, currency, id } = order
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          name: 'Visual AI',
          currency,
          description: product.description,
          order_id: id,
          amount,
          prefill: {
            name: userDetails.value?.fullName,
            email: userDetails.value?.email
          },
          notes: {
            userId: userDetails.value?.userId,
            credits: product.credits,
            subscribe
          },
          theme: {
            color: '#3b0764'
          },
          handler: async function (response: any) {
            console.log('response', response)
            const success = await verifyPayment(response)
            console.log('success', success)
            if (success) {
              successHandler(product.credits)
            } else {
              failureHandler(response)
            }
          }
        }
        // @ts-ignore
        const rzp = new Razorpay(options)
        rzp.on('payment.failed', function (response: any) {
          console.error(response) // Handle payment failure
        })
        rzp.open()
      }
    }
  } catch (error) {
    console.error(error)
  }
}

function successHandler(amount: number) {
  const dialogStore = useDialogStore()
  const userStore = useUserStore()
  const { hasJustSubscribed, credits } = storeToRefs(userStore)
  dialogStore.hideBuyCredits()
  hasJustSubscribed.value = true

  setTimeout(() => {
    const newCredits = (credits?.value ?? 0) + amount
    userStore.setCredits(newCredits)
  }, 700)
}

function failureHandler(response: any) {
  console.error(response) // Handle payment failure
}

async function verifyPayment(response: any) {
  const url = '/verify-payment'
  const { error, data } = await useFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(response)
  }).json<any>()
  if (error.value) {
    console.error('error', error.value)
    return false
  }
  if (data.value) {
    console.log('data', data.value)
    return true
  }
  return false
}

async function createOrder(product: RazorpayProduct) {
  const url = '/create-order'
  const { error, data: order } = await useFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors'
    },
    body: JSON.stringify({
      amount: product.price, // Amount in INR (without decimal, e.g., 500 = ₹5.00)
      currency: product.currency,
      receipt: `order_rcptid_${Math.random().toString(36).substring(2, 15)}`
    })
  }).json<any>()

  if (error.value) {
    console.error('error', error.value)
    return undefined
  }
  return order.value
}

export async function cancelSubscription(): Promise<void> {
  try {
    const userStore = useUserStore()
    const { userDetails } = storeToRefs(userStore)

    const url = '/payments/cancel-subscription'
    const { error, data } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors'
      },
      body: JSON.stringify({
        effectiveFrom: 'immediately',
        subscriptionId: userDetails.value?.subscriptionId
      })
    }).json()

    if (error.value) {
      console.error('error', error.value)
      return
    }
    if (data.value) {
      console.log('data', data.value)
    }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}
