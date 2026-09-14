import { config } from '@vue/test-utils';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBolt,
  faCircleInfo,
  faCopy,
  faDice,
  faExpand,
  faFile,
  faHeart,
  faImages,
  faMinus,
  faPlus,
  faTag,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(
  faBolt,
  faCircleInfo,
  faCopy,
  faDice,
  faExpand,
  faFile,
  faHeart,
  faImages,
  faMinus,
  faPlus,
  faTag,
  faWandMagicSparkles,
  faXmark,
);

config.global.components = {
  'font-awesome-icon': FontAwesomeIcon,
};

class TestEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 1;
  constructor(url: string) {
    this.url = url;
  }
  close() {
    this.readyState = 2;
  }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
}

if (typeof globalThis.EventSource === 'undefined') {
  globalThis.EventSource = TestEventSource as unknown as typeof EventSource;
}

const originalFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('telemetrydeck.com')) {
    return Promise.resolve(new Response(new Blob(), { status: 200 }));
  }
  return originalFetch(input, init);
}) as typeof fetch;
