import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref, type Ref } from 'vue';

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));

import { useFetch } from '@/composables/useFetch';
import {
  type UploadedFile,
  useToolVideoUpload,
  VIDEO_UPLOAD_RULES,
  type VideoUploadPurpose,
} from '@/composables/useToolVideoUpload';

const TEN_MB = 10 * 1024 * 1024;
const TWENTY_MB = 20 * 1024 * 1024;

function fakeFile(name: string, type: string, size = 1024) {
  const file = new File([new Uint8Array(8)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function respond(statusCode: number | null, data: unknown) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => ({ data: ref(data), statusCode: ref(statusCode) }),
  } as unknown as ReturnType<typeof useFetch>);
}

function setup(purpose: VideoUploadPurpose, initial: UploadedFile | null = null) {
  const uploaded: Ref<UploadedFile | null> = ref(initial);
  let api!: ReturnType<typeof useToolVideoUpload>;
  const wrapper = mount({
    setup() {
      api = useToolVideoUpload(purpose, uploaded);
      return {};
    },
    template: '<div />',
  });
  return { api, uploaded, wrapper };
}

describe('useToolVideoUpload', () => {
  beforeEach(() => {
    vi.mocked(useFetch).mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:preview-1');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('exposes per-purpose rules with the exact size copy', () => {
    expect(VIDEO_UPLOAD_RULES['video-audio'].tooLargeCopy).toBe('Audio must be 20 MB or smaller.');
    expect(VIDEO_UPLOAD_RULES['video-image'].tooLargeCopy).toBe('Image must be 10 MB or smaller.');
    expect(VIDEO_UPLOAD_RULES['video-audio'].maxBytes).toBe(TWENTY_MB);
    expect(VIDEO_UPLOAD_RULES['video-image'].maxBytes).toBe(TEN_MB);
  });

  it('starts idle, or ready when an attachment already exists', () => {
    expect(setup('video-image').api.status.value).toBe('idle');
    const existing = { uploadId: 'u0', name: 'a.png' };
    expect(setup('video-image', existing).api.status.value).toBe('ready');
  });

  it('rejects audio over 20 MB without uploading', async () => {
    const { api, uploaded } = setup('video-audio');
    await api.upload(fakeFile('big.mp3', 'audio/mpeg', TWENTY_MB + 1));
    expect(api.status.value).toBe('error');
    expect(api.error.value).toBe('Audio must be 20 MB or smaller.');
    expect(useFetch).not.toHaveBeenCalled();
    expect(uploaded.value).toBeNull();
  });

  it('rejects a file of the wrong type without uploading', async () => {
    const { api } = setup('video-audio');
    await api.upload(fakeFile('pic.png', 'image/png'));
    expect(api.error.value).toBe('Choose an MP3, WAV or FLAC file.');
    const image = setup('video-image');
    await image.api.upload(fakeFile('song.mp3', 'audio/mpeg'));
    expect(image.api.error.value).toBe('Choose a JPG, PNG, WEBP or BMP image.');
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('uploads an image and keeps only the id, name and a preview url', async () => {
    respond(200, { uploadId: 'up-1' });
    const { api, uploaded } = setup('video-image');
    await api.upload(fakeFile('cat.png', 'image/png'));
    expect(vi.mocked(useFetch).mock.calls[0]![0]).toBe('/media/uploads?purpose=video-image');
    expect(uploaded.value).toEqual({
      uploadId: 'up-1',
      name: 'cat.png',
      durationSec: undefined,
      previewUrl: 'blob:preview-1',
    });
    expect(api.status.value).toBe('ready');
    expect(api.error.value).toBe('');
  });

  it('uploads audio with its duration and no preview url', async () => {
    respond(200, { uploadId: 'up-2', durationSec: 12.4 });
    const { api, uploaded } = setup('video-audio');
    await api.upload(fakeFile('beat.mp3', 'audio/mpeg'));
    expect(uploaded.value).toEqual({
      uploadId: 'up-2',
      name: 'beat.mp3',
      durationSec: 12.4,
      previewUrl: undefined,
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('revokes the previous preview when a new file replaces it', async () => {
    respond(200, { uploadId: 'up-3' });
    const { api } = setup('video-image', {
      uploadId: 'old',
      name: 'old.png',
      previewUrl: 'blob:old',
    });
    await api.upload(fakeFile('new.png', 'image/png'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old');
  });

  it('shows the server message for a client-error rejection such as a renamed file', async () => {
    respond(415, { error: 'File content is not audio.' });
    const { api, uploaded } = setup('video-audio');
    await api.upload(fakeFile('fake.mp3', 'audio/mpeg'));
    expect(api.status.value).toBe('error');
    expect(api.error.value).toBe('File content is not audio.');
    expect(uploaded.value).toBeNull();
  });

  it('falls back to the message field of the error body', async () => {
    respond(400, { message: 'Bad upload.' });
    const { api } = setup('video-audio');
    await api.upload(fakeFile('a.mp3', 'audio/mpeg'));
    expect(api.error.value).toBe('Bad upload.');
  });

  it('uses generic copy for a server error and for a 4xx without a body', async () => {
    respond(500, { error: 'stack trace here' });
    const { api } = setup('video-audio');
    await api.upload(fakeFile('a.mp3', 'audio/mpeg'));
    expect(api.error.value).toBe('The upload failed. Try again.');
    respond(403, null);
    await api.upload(fakeFile('a.mp3', 'audio/mpeg'));
    expect(api.error.value).toBe('The upload failed. Try again.');
  });

  it('reports a network failure when there is no status code', async () => {
    respond(null, null);
    const { api } = setup('video-image');
    await api.upload(fakeFile('a.png', 'image/png'));
    expect(api.error.value).toBe('Could not reach the server. Try again.');
  });

  it('treats a 200 without an uploadId as a failure', async () => {
    respond(200, {});
    const { api, uploaded } = setup('video-image');
    await api.upload(fakeFile('a.png', 'image/png'));
    expect(api.status.value).toBe('error');
    expect(uploaded.value).toBeNull();
  });

  it('is uploading while the request is pending', async () => {
    let release!: (v: unknown) => void;
    vi.mocked(useFetch).mockReturnValue({
      json: () => new Promise((resolve) => (release = resolve)),
    } as unknown as ReturnType<typeof useFetch>);
    const { api } = setup('video-image');
    const pending = api.upload(fakeFile('a.png', 'image/png'));
    expect(api.isUploading.value).toBe(true);
    release({ data: ref({ uploadId: 'x' }), statusCode: ref(200) });
    await pending;
    expect(api.isUploading.value).toBe(false);
  });

  it('clear forgets the attachment and revokes its preview', () => {
    const { api, uploaded } = setup('video-image', {
      uploadId: 'u',
      name: 'a.png',
      previewUrl: 'blob:keep',
    });
    api.clear();
    expect(uploaded.value).toBeNull();
    expect(api.status.value).toBe('idle');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:keep');
  });

  it('clear without a preview revokes nothing', () => {
    const { api } = setup('video-audio', { uploadId: 'u', name: 'a.mp3' });
    api.clear();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('onPick uploads the chosen file and resets the input value', async () => {
    respond(200, { uploadId: 'p1' });
    const { api, uploaded } = setup('video-image');
    const input = { files: [fakeFile('a.png', 'image/png')], value: 'C:\\a.png' };
    api.onPick({ target: input } as unknown as Event);
    await vi.waitFor(() => expect(uploaded.value?.uploadId).toBe('p1'));
    expect(input.value).toBe('');
  });

  it('onPick with no file does nothing', () => {
    const { api } = setup('video-image');
    api.onPick({ target: { files: [], value: 'x' } } as unknown as Event);
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('tracks dragging and uploads a dropped file', async () => {
    respond(200, { uploadId: 'd1' });
    const { api, uploaded } = setup('video-image');
    const over = { preventDefault: vi.fn() } as unknown as DragEvent;
    api.onDragOver(over);
    expect(over.preventDefault).toHaveBeenCalled();
    expect(api.isDragging.value).toBe(true);
    api.onDragLeave();
    expect(api.isDragging.value).toBe(false);
    api.onDragOver(over);
    const drop = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [fakeFile('a.png', 'image/png')] },
    } as unknown as DragEvent;
    api.onDrop(drop);
    expect(api.isDragging.value).toBe(false);
    await vi.waitFor(() => expect(uploaded.value?.uploadId).toBe('d1'));
  });

  it('a drop without files uploads nothing', () => {
    const { api } = setup('video-image');
    api.onDrop({ preventDefault: vi.fn(), dataTransfer: null } as unknown as DragEvent);
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('revokes the preview on unmount', () => {
    const { wrapper } = setup('video-image', {
      uploadId: 'u',
      name: 'a.png',
      previewUrl: 'blob:unmount',
    });
    wrapper.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:unmount');
  });
});
