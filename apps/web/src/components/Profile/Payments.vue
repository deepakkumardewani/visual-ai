<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const { payments } = storeToRefs(userStore);

const loading = ref(true);

watch(
  payments,
  () => {
    loading.value = false;
  },
  { immediate: true },
);

const hasPayments = computed(() => (payments.value?.length ?? 0) > 0);

function statusClass(status: string) {
  const normalized = status?.toLowerCase() ?? '';
  if (normalized.includes('success') || normalized.includes('paid') || normalized === 'captured') {
    return 'status status--ok';
  }
  if (normalized.includes('fail') || normalized.includes('cancel')) {
    return 'status status--bad';
  }
  return 'status';
}
</script>

<template>
  <div class="payments">
    <div class="payments__header">
      <h2 class="payments__title">Payment history</h2>
      <p class="payments__subtitle">Past charges and subscription renewals.</p>
    </div>

    <div v-if="loading" class="payments__loading" role="status" aria-live="polite">
      <div class="payments__skeleton" />
      <div class="payments__skeleton" />
      <div class="payments__skeleton" />
    </div>

    <div v-else-if="!hasPayments" class="payments__empty">
      <p class="payments__empty-title">No payments yet</p>
      <p class="payments__empty-copy">
        When you upgrade or buy credits, your receipts will show up here.
      </p>
      <router-link to="/pricing" class="payments__cta">View plans</router-link>
    </div>

    <div v-else class="payments__table-wrap">
      <table class="payments__table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Amount</th>
            <th scope="col">Status</th>
            <th scope="col">Method</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in payments" :key="item.transactionId">
            <td data-label="Date">{{ item.humanReadableDate }}</td>
            <td data-label="Amount" class="payments__amount">₹{{ item.amount.toFixed(2) }}</td>
            <td data-label="Status">
              <span :class="statusClass(item.status)">{{ item.status }}</span>
            </td>
            <td data-label="Method">{{ item.paymentMethod }}</td>
            <td data-label="Description">{{ item.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.payments {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.payments__title {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 400;
  color: rgb(var(--tw-ink-primary));
}

.payments__subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: rgb(var(--tw-ink-muted));
}

.payments__loading {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.payments__skeleton {
  height: 3rem;
  border-radius: 10px;
  background: linear-gradient(
    90deg,
    rgb(var(--tw-surface-2)) 0%,
    rgb(var(--tw-surface-3)) 50%,
    rgb(var(--tw-surface-2)) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.payments__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1.5rem;
  border: 1px dashed rgb(var(--tw-border));
  border-radius: 12px;
  background: rgb(var(--tw-surface-2) / 0.35);
}

.payments__empty-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.payments__empty-copy {
  margin: 0;
  font-size: 0.9rem;
  color: rgb(var(--tw-ink-muted));
  max-width: 28rem;
}

.payments__cta {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  margin-top: 0.35rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    opacity: 0.92;
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.payments__table-wrap {
  overflow-x: auto;
  border: 1px solid rgb(var(--tw-border) / 0.7);
  border-radius: 12px;
}

.payments__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.payments__table th,
.payments__table td {
  padding: 0.85rem 1rem;
  text-align: left;
  vertical-align: top;
}

.payments__table th {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-muted));
  background: rgb(var(--tw-surface-2) / 0.55);
  border-bottom: 1px solid rgb(var(--tw-border) / 0.7);
  white-space: nowrap;
}

.payments__table td {
  color: rgb(var(--tw-ink-primary));
  border-bottom: 1px solid rgb(var(--tw-border) / 0.45);
}

.payments__table tbody tr:last-child td {
  border-bottom: 0;
}

.payments__table tbody tr:hover td {
  background: rgb(var(--tw-surface-2) / 0.35);
}

.payments__amount {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.status {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgb(var(--tw-surface-3));
  color: rgb(var(--tw-ink-muted));
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status--ok {
  background: rgba(111, 175, 122, 0.16);
  color: #6faf7a;
}

.status--bad {
  background: rgba(176, 60, 60, 0.14);
  color: #e08585;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 720px) {
  .payments__table thead {
    display: none;
  }

  .payments__table,
  .payments__table tbody,
  .payments__table tr,
  .payments__table td {
    display: block;
    width: 100%;
  }

  .payments__table tr {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgb(var(--tw-border) / 0.55);
  }

  .payments__table td {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.35rem 0;
    border-bottom: 0;
  }

  .payments__table td::before {
    content: attr(data-label);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgb(var(--tw-ink-muted));
  }
}

@media (prefers-reduced-motion: reduce) {
  .payments__skeleton {
    animation: none;
  }
}
</style>
