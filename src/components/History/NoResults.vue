<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

import { GroupedObject } from "@/types";

import { useAppStore } from "@/stores/app";
import { useUserStore } from "@/stores/user";

const props = defineProps<{
  isFavorites?: boolean;
  groupedHistory?: GroupedObject[];
}>();
const router = useRouter();
const { history } = storeToRefs(useUserStore());
const { tab } = storeToRefs(useAppStore());

function create() {
  if (props.isFavorites) {
    router.push("/dashboard");
  }
  tab.value = 1;
}
</script>
<template>
  <div
    v-if="history.length === 0"
    class="tw-flex tw-justify-center tw-items-center tw-h-full tw-text-xl tw-mx-auto"
  >
    <div class="tw-text-center tw-text-neutral-400">
      <div>You have not created any thing yet.</div>
      <div>
        Go ahead and
        <span
          @click="create"
          class="tw-text-[#ba68c8] tw-cursor-pointer tw-font-bold hover:tw-underline"
          >create</span
        >
        something.
      </div>
    </div>
  </div>

  <div
    v-if="!isFavorites && history.length !== 0 && groupedHistory?.length === 0"
    class="tw-flex tw-justify-center tw-items-center tw-h-full tw-text-xl tw-mx-auto"
  >
    <div class="tw-text-center tw-text-neutral-400">
      <div>No results found.</div>
    </div>
  </div>

  <div
    v-if="isFavorites && history.length !== 0 && groupedHistory?.length === 0"
    class="tw-flex tw-justify-center tw-items-center tw-h-full tw-text-xl tw-mx-auto"
  >
    <div class="tw-text-center tw-text-neutral-400">
      <div>You have not added any favorites yet.</div>
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
