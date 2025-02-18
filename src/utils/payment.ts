import { storeToRefs } from 'pinia'

import { RazorpayOrder, RazorpayProduct, RazorpaySubscription } from '@/types'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import { useFetch } from '@/composables/useFetch'

export async function initiatePayment(product: RazorpayProduct, subscribe: boolean = false) {
  try {
    const userStore = useUserStore()
    const { userDetails, isPro } = storeToRefs(userStore)

    if (subscribe) {
      const subscription = await createSubscription()
      if (subscription) {
        const subscriptionId = 'sub_Ps8RzYsAxA5QfQ'
        console.log('subscription', subscription)
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          name: 'Visual AI',
          subscription_id: subscriptionId,
          description: product.description,
          notes: {
            userId: userDetails.value?.userId,
            credits: product.credits,
            subscribe,
            subscriptionId
          },
          handler: function (response: any) {
            // TODO: Handle update button in card
            isPro.value = true
            console.log('response', response)
          }
        }
        // @ts-ignore
        const rzp = new Razorpay(options)
        rzp.on('payment.failed', function (response: any) {
          console.error(response) // Handle payment failure
        })
        rzp.open()
      }
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
            const success = await verifyPayment(response)
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
  const appStore = useAppStore()
  const { snackbar, snackbarTimeout, snackbarText } = storeToRefs(appStore)
  dialogStore.hideBuyCredits()
  hasJustSubscribed.value = true

  setTimeout(() => {
    const newCredits = (credits?.value ?? 0) + amount
    userStore.setCredits(newCredits)
    snackbar.value = true
    snackbarTimeout.value = 2000
    snackbarText.value = 'Payment successful'
  }, 700)
}

function failureHandler(response: any) {
  console.error(response) // Handle payment failure
}

async function verifyPayment(response: any) {
  const url = '/payments/verify-payment'
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
  const url = '/payments/order/create'
  const receiptId = `order_rcptid_${Math.random().toString(36).substring(2, 15)}`
  const { error, data: order } = await useFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors'
    },
    body: JSON.stringify({
      amount: product.price, // Amount in INR (without decimal, e.g., 500 = ₹5.00)
      currency: product.currency,
      receipt: receiptId
    })
  }).json<RazorpayOrder>()

  if (error.value) {
    console.error('error', error.value)
    return undefined
  }
  return order.value
}
async function createSubscription() {
  const url = '/payments/subscription/create'
  const { error, data } = await useFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: import.meta.env.VITE_RAZORPAY_PLAN_ID
    })
  }).json<RazorpaySubscription>()
  if (error.value) {
    console.error('error', error.value)
    return undefined
  }

  return data.value
}

export async function cancelSubscription(): Promise<void> {
  try {
    const userStore = useUserStore()
    const { userDetails } = storeToRefs(userStore)

    const url = '/payments/subscription/cancel'
    const { error, data } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors'
      },
      body: JSON.stringify({
        userId: userDetails.value?.userId
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
