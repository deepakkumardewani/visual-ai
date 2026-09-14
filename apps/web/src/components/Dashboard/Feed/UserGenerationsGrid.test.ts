import { createPinia, setActivePinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn: { value: false }, user: { value: null } }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import UserGenerationsGrid from '@/components/Dashboard/Feed/UserGenerationsGrid.vue';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';
import { FeatureType, type IImageObject } from '@/types';

const sample: IImageObject = {
  _id: 'gen-1',
  userId: 'user-1',
  prompt: 'A quiet lake at dawn',
  featureType: FeatureType.IMAGE,
  modelName: 'Flux Basic',
  createdAt: new Date('2024-06-01T10:30:00.000Z'),
  images: [
    {
      name: 'lake',
      aiImageUrl: 'https://cdn.example.com/lake.jpg',
      resolution: '1k',
      aspectRatio: '1:1',
      width: 1024,
      height: 1024,
      format: 'jpg',
      bytes: 1200,
    },
  ],
};

const stubs = {
  'font-awesome-icon': true,
  GenerationErrorBanner: { template: '<div data-testid="generation-error-stub" />' },
  ResultNextActions: { template: '<div data-testid="result-next-actions-stub" />' },
  ImageDialog: { template: '<div data-testid="image-dialog-stub" />' },
  ImageActionButtons: { template: '<div data-testid="image-actions-stub" />' },
};

describe('UserGenerationsGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the empty creations header', () => {
    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [createPinia()], stubs },
    });

    expect(wrapper.get('[data-testid="user-generations-grid"]').text()).toContain('Your creations');
    expect(wrapper.text()).toContain('0');
    expect(wrapper.find('[data-testid="user-generation-card"]').exists()).toBe(false);
  });

  it('filters non-image history out of the grid', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [
      sample,
      { ...sample, _id: 'up-1', featureType: FeatureType.UPSCALE, prompt: 'Upscaled lake' },
    ];

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.findAll('[data-testid="user-generation-card"]')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('Upscaled lake');
  });

  it('renders history cards and remixed prompts', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [sample];

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.get('[data-testid="user-generation-card"]').text()).toContain(
      'A quiet lake at dawn',
    );
    expect(wrapper.text()).toContain('Flux Basic');
    expect(wrapper.text()).toContain('1024×1024');

    await wrapper.get('button.remix-btn').trigger('click');
    expect(useAsideStore().typingPrompt).toBe('A quiet lake at dawn');
  });

  it('omits dimensions when width or height is missing', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [
      {
        ...sample,
        images: [
          {
            ...sample.images[0],
            width: undefined as unknown as number,
            height: undefined as unknown as number,
          },
        ],
      },
    ];

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.text()).not.toContain('×');
  });

  it('shows pending tiles while generating and opens the image dialog', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [sample];
    useGenerateStore().isLoading = true;
    useGenerateStore().activePrompt = 'A quiet lake at dawn';
    useAsideStore().noOfOutputs = 2;

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.get('[data-testid="pending-generation-row"]').text()).toContain('Generating');
    expect(wrapper.findAll('[data-testid="pending-tile"]')).toHaveLength(2);

    await wrapper.get('[aria-label^="View image"]').trigger('click');
    expect(useDialogStore().showImageDialog).toBe(true);
  });

  it('opens the dialog from Enter and Space on a tile', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [sample];

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    const tile = wrapper.get('[aria-label^="View image"]');
    await tile.trigger('keydown', { key: 'Enter' });
    expect(useDialogStore().showImageDialog).toBe(true);

    useDialogStore().showImageDialog = false;
    await tile.trigger('keydown', { key: ' ' });
    expect(useDialogStore().showImageDialog).toBe(true);

    useDialogStore().showImageDialog = false;
    await tile.trigger('keydown', { key: 'Tab' });
    expect(useDialogStore().showImageDialog).toBe(false);
  });

  it('shows real job progress percent and status', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useGenerateStore().isLoading = true;
    useGenerateStore().jobProgress = 42.4;
    useGenerateStore().jobStatus = 'processing';
    useGenerateStore().activePrompt = 'Lake';

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.get('[aria-label="42% complete"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('42%');

    useGenerateStore().jobProgress = null;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Processing');

    useGenerateStore().jobStatus = 'queued';
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('queued');
  });

  it('reveals next actions when a generation finishes', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [sample];
    useGenerateStore().isLoading = true;

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.find('[data-testid="result-next-actions-stub"]').exists()).toBe(false);

    useGenerateStore().isLoading = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="result-next-actions-stub"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="user-generation-card"]').classes()).toContain(
      'generation-row--fresh',
    );

    await wrapper.get('[data-testid="user-generation-card"]').trigger('animationend');
    expect(wrapper.get('[data-testid="user-generation-card"]').classes()).not.toContain(
      'generation-row--fresh',
    );
  });

  it('uses a Cloudinary URL when a public id is present', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [
      {
        ...sample,
        images: [
          { ...sample.images[0], aiImagePublicId: 'folder/lake', aiImageUrl: 'https://unused' },
        ],
      },
    ];

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    const src = wrapper.get('img').attributes('src') ?? '';
    expect(src).toContain('/q_auto,f_auto/folder/lake');
  });

  it('falls back to a square aspect when the ratio is missing a colon', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useGenerateStore().isLoading = true;
    useAsideStore().aspectRatio = { ...useAsideStore().aspectRatio, title: 'square' };

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.get('[data-testid="pending-tile"]').attributes('style')).toContain('1 / 1');
  });

  it('groups creations from different days', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [
      sample,
      {
        ...sample,
        _id: 'gen-2',
        prompt: 'Night market',
        createdAt: new Date('2024-06-03T18:00:00.000Z'),
      },
    ];

    const wrapper = mount(UserGenerationsGrid, {
      global: { plugins: [pinia], stubs },
    });

    await flushPromises();
    expect(wrapper.findAll('[data-testid="generation-date-group"]').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(wrapper.text()).toContain('Night market');
  });

  it('uses the singular pending label for one output', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useGenerateStore().isLoading = true;
    useAsideStore().noOfOutputs = 1;

    const wrapper = mount(UserGenerationsGrid, { global: { plugins: [pinia], stubs } });
    expect(wrapper.get('[data-testid="pending-generation-row"]').text()).toContain('1 image');
  });

  it('treats non-finite job progress as unknown', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useGenerateStore().isLoading = true;
    useGenerateStore().jobProgress = Number.NaN;
    useGenerateStore().jobStatus = '';

    const wrapper = mount(UserGenerationsGrid, { global: { plugins: [pinia], stubs } });
    expect(wrapper.find('[aria-label$="% complete"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Generating');
  });

  it('skips the image when no URL can be resolved', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [
      {
        ...sample,
        images: [{ ...sample.images[0], aiImageUrl: '', aiImagePublicId: undefined }],
      },
    ];

    const wrapper = mount(UserGenerationsGrid, { global: { plugins: [pinia], stubs } });
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('keys tiles by image id when present', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().history = [
      {
        ...sample,
        images: [
          { ...sample.images[0], _id: 'img-1', name: '' },
          { ...sample.images[0], _id: undefined as unknown as string, name: '', aiImageUrl: '' },
        ],
      },
    ];

    const wrapper = mount(UserGenerationsGrid, { global: { plugins: [pinia], stubs } });
    expect(wrapper.findAll('[aria-label^="View image"]')).toHaveLength(2);
  });

  it('does not mark a fresh row when history is empty after loading ends', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useGenerateStore().isLoading = true;

    const wrapper = mount(UserGenerationsGrid, { global: { plugins: [pinia], stubs } });
    useGenerateStore().isLoading = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="result-next-actions-stub"]').exists()).toBe(false);
  });
});
