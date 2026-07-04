<script setup lang="ts">
import ComposerTextarea from '@/components/Dashboard/Composer/ComposerTextarea.vue';
import GenerateArrow from '@/components/Dashboard/Composer/GenerateArrow.vue';
import ModelPicker from '@/components/Dashboard/ControlRail/ModelPicker.vue';
import SettingsPopovers from '@/components/Dashboard/Composer/SettingsPopovers.vue';
import SignupDialog from '@/components/Dialogs/SignupDialog.vue';
</script>

<template>
  <section
    data-testid="hero-composer"
    class="tw-mx-auto tw-w-full tw-max-w-[800px] tw-px-4 tw-pt-[min(12vh,6rem)]"
  >
    <div
      class="tw-rounded-lg tw-border tw-border-hairline tw-bg-surface-1 tw-p-4 tw-shadow-elevated sm:tw-p-5"
    >
      <ComposerTextarea />

      <div
        data-testid="hero-composer-controls"
        class="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2"
      >
        <ModelPicker chip />
        <SettingsPopovers />
        <GenerateArrow class="tw-ml-auto" />
      </div>
    </div>

    <SignupDialog />
  </section>
</template>

<style scoped>
:deep([data-testid='model-picker'] .tw-relative.tw-inline-block) {
  display: inline-block;
  width: auto;
}

:deep([data-testid='model-picker'] .tw-relative.tw-inline-block > button) {
  width: auto;
  min-height: 44px;
  padding: 0;
  border: none;
  background: transparent;
}
</style>
