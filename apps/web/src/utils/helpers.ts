import { storeToRefs } from 'pinia';

import type { IImage, IImageObject } from '@/types';

import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('helpers');

export const deleteImage = async (event: Event, image: IImageObject) => {
  event.stopPropagation();
  const generateStore = useGenerateStore();
  const { isDeleting, deletingImageIds } = storeToRefs(generateStore);
  const dialogStore = useDialogStore();
  const userStore = useUserStore();

  isDeleting.value = true;
  if (image._id) {
    deletingImageIds.value.push(image._id);
  }

  const { userId, history } = storeToRefs(userStore);
  const url = `/image/delete`;
  const { error, data } = await useFetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors',
    },
    body: JSON.stringify({
      image,
      userId: userId.value,
    }),
  }).json();
  if (error.value) {
    log.error('deleteImage failed', { error: error.value, imageId: image._id });
    isDeleting.value = false;
    deletingImageIds.value = deletingImageIds.value.filter((id) => id !== image._id);
    return;
  }
  if (data.value) {
    isDeleting.value = false;
    deletingImageIds.value = deletingImageIds.value.filter((id) => id === data.value.imageId);
    dialogStore.hideImage();
    history.value = history.value.filter((item: IImageObject) => item._id !== image._id);
  }
};
export const favoriteImage = async (event: Event, imageId: string) => {
  event.stopPropagation();
  const generateStore = useGenerateStore();
  const { isFavoriting } = storeToRefs(generateStore);
  const userStore = useUserStore();
  const { userId, history } = storeToRefs(userStore);
  isFavoriting.value = true;
  const url = `/image/favorite`;
  const { error, data } = await useFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors',
    },
    body: JSON.stringify({
      imageId,
      userId: userId.value,
    }),
  }).json();
  if (error.value) {
    log.error('favoriteImage failed', { error: error.value, imageId });
    isFavoriting.value = false;
    return;
  }
  if (data.value) {
    history.value = history.value.map((item: IImageObject) => {
      if (item._id === imageId) {
        return { ...item, isFavorite: data.value.isFavorite };
      }
      return item;
    });
  }
  isFavoriting.value = false;
};
export const downloadImage = async (event?: Event, image?: string) => {
  event?.stopPropagation();

  if (!image) return false;

  try {
    const response = await fetch(image);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const mimeExt = blob.type.split('/')[1]?.replace('jpeg', 'jpg');
    const pathExt = image.split('?')[0]?.split('.').pop();
    const ext = mimeExt || pathExt || 'png';
    a.download = `image-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    return true;
  } catch (error) {
    log.error('downloadImage failed', { error, image });
    return false;
  }
};

export const bulkFavorite = async (images: IImageObject[]) => {
  const userStore = useUserStore();
  const { userId, history } = storeToRefs(userStore);
  const historyStore = useHistoryStore();
  const { isBulkFavoriting } = storeToRefs(historyStore);
  isBulkFavoriting.value = true;
  const url = `/image/favorite/bulk`;
  const { error, data } = await useFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors',
    },
    body: JSON.stringify({ imageIds: images.map((img) => img._id), userId: userId.value }),
  }).json();
  if (error.value) {
    log.error('bulkFavorite failed', { error: error.value, count: images.length });
    isBulkFavoriting.value = false;
    return;
  }
  if (data.value) {
    history.value = history.value.map((item: IImageObject) => {
      if (images.some((img) => img._id === item._id)) {
        return { ...item, isFavorite: true };
      }
      return item;
    });
  }
};
export const bulkDelete = async (images: IImageObject[]) => {
  const userStore = useUserStore();
  const { userId, history } = storeToRefs(userStore);
  const historyStore = useHistoryStore();
  const { isBulkDeleting } = storeToRefs(historyStore);
  const publicIds = getPublicIds(images);
  isBulkDeleting.value = true;
  const url = `/image/delete/bulk`;
  const { error, data } = await useFetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors',
    },
    body: JSON.stringify({
      publicIds,
      imageIds: images.map((img) => img._id),
      userId: userId.value,
    }),
  }).json();
  if (error.value) {
    log.error('bulkDelete failed', { error: error.value, count: images.length });
    isBulkDeleting.value = false;
    return;
  }
  if (data.value) {
    history.value = history.value.filter(
      (item: IImageObject) => !images.some((img) => img._id === item._id),
    );
    isBulkDeleting.value = false;
  }
};
export const bulkDownload = async (images: IImageObject[]) => {
  images.forEach(async (image) => {
    if (!image) return;

    try {
      if (image.featureType === 'image') {
        for (const img of image.images) {
          if (img.aiImagePublicId) {
            const imageUrl = getDownloadImageUrl(img);
            await downloadImage(undefined, imageUrl);
          }
        }
      } else {
        for (const img of image.images) {
          if (img.enhancedPublicId) {
            const imageUrl = getDownloadImageUrl(img);
            await downloadImage(undefined, imageUrl);
          }
        }
      }
    } catch (error) {
      log.error('bulkDownload failed', { error, imageId: image._id });
    }
  });
};

export const applyReferralCode = async (code: string) => {
  const userStore = useUserStore();
  const dialogStore = useDialogStore();
  const { userId, userDetails } = storeToRefs(userStore);
  const url = `/users/apply-referral`;
  const { error, data, response } = await useFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors',
    },
    body: JSON.stringify({
      userId: userId.value,
      userEmail: userDetails.value?.email,
      userName: userDetails.value?.userName,
      referralCode: code,
    }),
  }).json();
  if (data.value) {
    userStore.setCredits(data.value.credits);
    dialogStore.hideReferral();
  }

  if (error.value) {
    // Check response status and parse error message from response
    if (response.value?.status === 400) {
      const errorData = await response.value.json();
      throw new Error(errorData.message);
    }
    // Handle other types of errors
    log.error('applyReferralCode failed', { error: error.value, code });
    throw new Error('Something went wrong');
  }
};
export const contactForm = async (formData: any) => {
  const url = `/users/contact`;
  const { error, data, response } = await useFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors',
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
    }),
  }).json();

  if (error.value) {
    // Check response status and parse error message from response
    if (response.value?.status === 400) {
      const errorData = await response.value.json();
      throw new Error(errorData.message);
    }
    // Handle other types of errors
    log.error('contactForm failed', { error: error.value });
    throw new Error('Something went wrong');
  }
  if (data.value) {
    log.debug('contactForm submitted', { data: data.value });
  }
};
export const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return '';

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

export function getPublicIds(images: IImageObject[]): string[] {
  const publicIdsToDelete: string[] = [];

  images.forEach((image) => {
    if (image.featureType === 'image') {
      // For image type, only collect aiImagePublicId
      image.images.forEach((img: IImage) => {
        if (img.aiImagePublicId) {
          publicIdsToDelete.push(img.aiImagePublicId);
        }
      });
    } else {
      // For other types (enhance), collect both original and enhanced public IDs
      image.images.forEach((img: IImage) => {
        if (img.originalPublicId) {
          publicIdsToDelete.push(img.originalPublicId);
        }
        if (img.enhancedPublicId) {
          publicIdsToDelete.push(img.enhancedPublicId);
        }
      });
    }
  });
  return publicIdsToDelete;
}

export const getDownloadImageUrl = (image: IImage) => {
  const publicId = image.aiImagePublicId ? image.aiImagePublicId : image.enhancedPublicId;
  const format = image.format;
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  // const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${publicId}.${format}`
  return `${cloudinaryBaseUrl}/${publicId}.${format}`;
};

export const cancelSubscription = (subscriptionId: string) => ({
  url: `/api/subscriptions/${subscriptionId}`,
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
});
