import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref, shallowRef } from 'vue';

import type { MediaAssetDto } from '@visual-ai/shared';

import ExportDialog from '@/components/Audio/ExportDialog.vue';
import type { ExportResult } from '@/composables/useAudioExport';
import type { PlayerTrack } from '@/stores/player';
import { createEditState } from '@/utils/audioEditMath';

const h = vi.hoisted(() => ({ exporter: undefined as unknown, args: undefined as unknown }));

vi.mock('@/composables/useAudioExport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/composables/useAudioExport')>();
  return {
    ...actual,
    useAudioExport: (source: unknown) => {
      h.args = source;
      return h.exporter;
    },
  };
});

const TRACK: PlayerTrack = { id: 't1', title: 'Night Drive', src: 'https://cdn.test/a.mp3' };

const ModalStub = defineComponent({
  props: { open: Boolean, labelledBy: String, trapFocus: Boolean, maxWidth: String },
  emits: ['update:open'],
  template: `<div v-if="open" role="dialog" :aria-labelledby="labelledBy" :data-trap="trapFocus">
    <h2 :id="labelledBy"><slot name="title" /></h2>
    <slot />
    <div data-testid="actions"><slot name="actions" /></div>
    <button data-testid="modal-close" @click="$emit('update:open', false)">x</button>
    <button data-testid="modal-open-signal" @click="$emit('update:open', true)">y</button>
  </div>`,
});

function makeExporter() {
  return {
    status: ref('idle'),
    progress: ref(0),
    errorMessage: ref<string | null>(null),
    result: shallowRef<ExportResult | null>(null),
    isEncoding: ref(false),
    isSaving: ref(false),
    saveError: ref<string | null>(null),
    savedVersion: shallowRef<MediaAssetDto | null>(null),
    start: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
    saveVersion: vi.fn(),
  };
}

let exporter: ReturnType<typeof makeExporter>;
let wrapper: VueWrapper;

function render(props: Record<string, unknown> = {}) {
  wrapper = mount(ExportDialog, {
    props: {
      open: true,
      assetId: 'a1',
      track: TRACK,
      edit: createEditState(10),
      sourceDuration: 10,
      ...props,
    },
    global: { stubs: { AppModal: ModalStub } },
  });
  return wrapper;
}

const byId = (id: string) => wrapper.find(`[data-testid="${id}"]`);

beforeEach(() => {
  exporter = makeExporter();
  h.exporter = exporter;
  vi.stubGlobal(
    'URL',
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() }),
  );
});

afterEach(() => {
  wrapper.unmount();
  vi.unstubAllGlobals();
});

describe('ExportDialog', () => {
  it('is a labelled dialog that traps focus and offers MP3 and WAV with size estimates', () => {
    render();
    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.attributes('data-trap')).toBe('true');
    expect(wrapper.get(`#${dialog.attributes('aria-labelledby')}`).text()).toBe('Export your song');
    expect(byId('export-format-mp3').exists()).toBe(true);
    expect(byId('export-format-wav').exists()).toBe(true);
    // 10 s at 192 kbps = 240,000 bytes; 10 s of 44.1 kHz stereo 16-bit = 1,764,044 bytes
    expect(byId('export-size-mp3').text()).toBe('About 234 KB');
    expect(byId('export-size-wav').text()).toBe('About 1.7 MB');
  });

  it('passes the live track, edit and duration to the exporter', () => {
    render();
    const args = h.args as { track: { value: PlayerTrack }; sourceDuration: { value: number } };
    expect(args.track.value).toEqual(TRACK);
    expect(args.sourceDuration.value).toBe(10);
  });

  it('starts an MP3 export by default and a WAV export once WAV is picked', async () => {
    render();
    expect(byId('export-format-mp3').element).toHaveProperty('checked', true);
    await byId('export-start').trigger('click');
    expect(exporter.start).toHaveBeenLastCalledWith('mp3');
    await byId('export-format-wav').setValue(true);
    await byId('export-start').trigger('click');
    expect(exporter.start).toHaveBeenLastCalledWith('wav');
  });

  it('discards a finished render when the format choice changes', async () => {
    render();
    exporter.reset.mockClear();
    await byId('export-format-wav').setValue(true);
    expect(exporter.reset).toHaveBeenCalledTimes(1);
  });

  it('shows an accessible progress bar and Cancel while encoding, and disables the format choice', async () => {
    exporter.isEncoding.value = true;
    exporter.progress.value = 0.42;
    render();
    const bar = byId('export-progress');
    expect(bar.attributes('role')).toBe('progressbar');
    expect(bar.attributes('aria-valuenow')).toBe('42');
    expect(wrapper.text()).toContain('Exporting 42%');
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined();
    expect(byId('export-start').exists()).toBe(false);
    await byId('export-cancel').trigger('click');
    expect(exporter.cancel).toHaveBeenCalledTimes(1);
  });

  it('hides progress when idle', () => {
    render();
    expect(byId('export-progress').exists()).toBe(false);
    expect(byId('export-cancel').exists()).toBe(false);
  });

  it('shows the error and relabels the button Try again', () => {
    exporter.errorMessage.value = 'This audio is too long to export in the browser.';
    render();
    expect(byId('export-error').text()).toBe('This audio is too long to export in the browser.');
    expect(byId('export-start').text()).toBe('Try again');
  });

  describe('after a render', () => {
    const RESULT: ExportResult = {
      blob: new Blob(['x'], { type: 'audio/wav' }),
      format: 'wav',
      filename: 'Night-Drive-edit.wav',
    };

    beforeEach(() => {
      exporter.result.value = RESULT;
    });

    it('offers Download with the filename and Save as new version instead of Export', () => {
      render();
      const link = byId('export-download');
      expect(link.attributes('download')).toBe('Night-Drive-edit.wav');
      expect(link.attributes('href')).toBe('blob:fake');
      expect(byId('export-start').exists()).toBe(false);
      expect(byId('export-save').text()).toBe('Save as new version');
    });

    it('saves against the asset id', async () => {
      render({ assetId: 'asset-9' });
      await byId('export-save').trigger('click');
      expect(exporter.saveVersion).toHaveBeenCalledWith('asset-9');
    });

    it('disables save and shows Saving... while uploading', () => {
      exporter.isSaving.value = true;
      render();
      expect(byId('export-save').text()).toBe('Saving...');
      expect(byId('export-save').attributes('disabled')).toBeDefined();
    });

    it('confirms a saved version with no credits used and blocks a second save', () => {
      exporter.savedVersion.value = { id: 'v1' } as unknown as MediaAssetDto;
      render();
      expect(byId('export-saved').text()).toBe('Saved as a new version. No credits were used.');
      expect(byId('export-save').attributes('disabled')).toBeDefined();
    });

    it('shows a save error', () => {
      exporter.saveError.value = 'We could not save this version. Try again.';
      render();
      expect(byId('export-save-error').text()).toBe('We could not save this version. Try again.');
      expect(byId('export-saved').exists()).toBe(false);
    });
  });

  describe('closing', () => {
    it('cancels, resets and emits update:open false when the modal asks to close', async () => {
      render();
      await byId('modal-close').trigger('click');
      expect(exporter.cancel).toHaveBeenCalled();
      expect(exporter.reset).toHaveBeenCalled();
      expect(wrapper.emitted('update:open')).toEqual([[false]]);
    });

    it('does not close when the modal reports open true', async () => {
      render();
      await byId('modal-open-signal').trigger('click');
      expect(exporter.cancel).not.toHaveBeenCalled();
      expect(wrapper.emitted('update:open')).toBeUndefined();
    });

    it('cancels an in-flight export when the parent closes the dialog', async () => {
      render();
      await wrapper.setProps({ open: false });
      await nextTick();
      expect(exporter.cancel).toHaveBeenCalledTimes(1);
    });

    it('does not cancel when the dialog opens', async () => {
      render({ open: false });
      await wrapper.setProps({ open: true });
      expect(exporter.cancel).not.toHaveBeenCalled();
    });
  });
});
