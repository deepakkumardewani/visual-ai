<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { payments } = storeToRefs(userStore)

// interface IPayment {
//   transactionId: string
//   amount: number
//   description: string
//   status: string
//   paymentMethod: string
//   createdAt: Date
//   humanReadableDate: string
// }
const headers = [
  { title: 'Date', value: 'humanReadableDate' },
  { title: 'Amount', value: 'amount' },
  { title: 'Status', value: 'status' },
  { title: 'Payment Method', value: 'paymentMethod' },
  { title: 'Description', value: 'description' }
]

const loading = ref(true)
loading.value = false
console.log(payments.value)
</script>

<template>
  <div class="tw-w-full">
    <v-card>
      <!-- <v-card-title class="tw-flex tw-justify-between tw-items-center">
        <span>Payment History</span>
        <v-chip color="success" class="tw-ml-4" size="small"> Active Subscription </v-chip>
      </v-card-title> -->
      <v-data-table
        :headers="headers"
        :items="payments"
        :loading="loading"
        class="tw-elevation-1"
        :hide-default-footer="payments.length < 10"
      >
        <template v-slot:[`item.amount`]="{ item }"> ${{ item.amount.toFixed(2) }} </template>
        <template v-slot:[`item.status`]="{ item }">
          <v-chip :color="item.status === 'active' ? 'success' : 'warning'">
            {{ item.status }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
