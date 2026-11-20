import { driver, type Config, type Driver, type DriveStep, type PopoverDOM } from 'driver.js';
import 'driver.js/dist/driver.css';
import { createApp, h, reactive, type App } from 'vue';

import { useAppStore } from '@/stores/app';

import TourPopover from './TourPopover.vue';

/** Single source of truth for the `data-tour` anchors (templates keep the literals). */
export const TOUR_ANCHORS = {
  modelPicker: 'model-picker',
  stylePicker: 'style-picker',
  sizes: 'sizes',
  promptBar: 'prompt-bar',
  mic: 'mic',
  promptTools: 'prompt-tools',
  refImage: 'ref-image',
  exploreTab: 'explore-tab',
} as const;

export interface TourStepDef {
  anchor: (typeof TOUR_ANCHORS)[keyof typeof TOUR_ANCHORS];
  title: string;
  description: string;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export const TOUR_STEPS: readonly TourStepDef[] = [
  {
    anchor: TOUR_ANCHORS.modelPicker,
    title: 'Pick a model',
    description: 'Each model has its own look. Switch any time.',
    side: 'right',
  },
  {
    anchor: TOUR_ANCHORS.stylePicker,
    title: 'Choose a style',
    description: 'Apply a style to shape the mood of the image.',
    side: 'right',
  },
  {
    anchor: TOUR_ANCHORS.sizes,
    title: 'Pick a size',
    description: 'More aspect ratios for posts, wallpapers and prints.',
    side: 'right',
  },
  {
    anchor: TOUR_ANCHORS.promptBar,
    title: 'Describe your image',
    description: 'Type what you want to see and press generate.',
    side: 'top',
  },
  {
    anchor: TOUR_ANCHORS.mic,
    title: 'Say it instead',
    description: 'Tap the mic to dictate your prompt.',
    side: 'top',
  },
  {
    anchor: TOUR_ANCHORS.promptTools,
    title: 'Prompt tools',
    description: 'Improve, generate or save prompts from here.',
    side: 'top',
  },
  {
    anchor: TOUR_ANCHORS.refImage,
    title: 'Add a reference image',
    description: 'Guide the result with a picture of your own.',
    side: 'top',
  },
  {
    anchor: TOUR_ANCHORS.exploreTab,
    title: 'Explore',
    description: 'See what the community is making and get inspired.',
    side: 'bottom',
  },
];

export const MIN_TOUR_STEPS = 2;
export const TOUR_TOO_FEW_STEPS_MESSAGE =
  'The tour needs the full dashboard. Try it on a larger screen.';
const TOUR_TOAST_TIMEOUT_MS = 4000;
const READY_POLL_MS = 100;
const READY_TIMEOUT_MS = 1500;
const POPOVER_CLASS = 'tour-popover';
const HOST_CLASS = 'tour-popover-host';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export interface ResolvedTourStep extends TourStepDef {
  element: HTMLElement;
}

export function tourSelector(anchor: TourStepDef['anchor']): string {
  return `[data-tour="${anchor}"]`;
}

function isVisible(element: HTMLElement): boolean {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
}

/** Several anchors can exist (desktop and mobile variants); take the one on screen. */
function findVisibleAnchor(root: ParentNode, anchor: TourStepDef['anchor']): HTMLElement | null {
  const candidates = root.querySelectorAll<HTMLElement>(tourSelector(anchor));
  return Array.from(candidates).find(isVisible) ?? null;
}

/** Steps whose anchor is missing or hidden (e.g. the rail on mobile) are dropped. */
export function resolveTourSteps(root: ParentNode = document): ResolvedTourStep[] {
  return TOUR_STEPS.flatMap((step) => {
    const element = findVisibleAnchor(root, step.anchor);
    return element ? [{ ...step, element }] : [];
  });
}

/** Lazily rendered anchors: wait until the visible-anchor count stops changing. */
export async function waitForTourAnchors(root: ParentNode = document): Promise<void> {
  let previousCount = -1;
  for (let waited = 0; waited <= READY_TIMEOUT_MS; waited += READY_POLL_MS) {
    const count = resolveTourSteps(root).length;
    if (count === previousCount && count >= MIN_TOUR_STEPS) return;
    previousCount = count;
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function showToast(message: string): void {
  const appStore = useAppStore();
  appStore.snackbarText = message;
  appStore.snackbarTimeout = TOUR_TOAST_TIMEOUT_MS;
  appStore.snackbar = true;
}

interface PopoverView {
  step: number;
  total: number;
  title: string;
  description: string;
}

/** Replaces driver.js's default popover contents with the token-styled TourPopover. */
function mountPopover(popover: PopoverDOM, tour: Driver, view: PopoverView): App {
  [popover.title, popover.description, popover.footer, popover.closeButton].forEach((node) => {
    node.style.display = 'none';
  });
  const host = document.createElement('div');
  popover.wrapper.querySelectorAll(`.${HOST_CLASS}`).forEach((stale) => stale.remove());
  host.className = HOST_CLASS;
  popover.wrapper.appendChild(host);

  const app = createApp({
    render: () =>
      h(TourPopover, {
        ...view,
        onPrev: () => tour.movePrevious(),
        onNext: () => (tour.isLastStep() ? tour.destroy() : tour.moveNext()),
        onSkip: () => tour.destroy(),
        onClose: () => tour.destroy(),
      }),
  });
  app.mount(host);
  return app;
}

function toDriveStep(step: ResolvedTourStep): DriveStep {
  return {
    element: step.element,
    popover: { title: step.title, description: step.description, side: step.side, align: 'center' },
  };
}

function buildConfig(steps: ResolvedTourStep[], onRender: Config['onPopoverRender']): Config {
  return {
    steps: steps.map(toDriveStep),
    animate: !prefersReducedMotion(),
    smoothScroll: !prefersReducedMotion(),
    showButtons: [],
    allowClose: true,
    popoverClass: POPOVER_CLASS,
    overlayOpacity: 0.7,
    onPopoverRender: onRender,
  };
}

/** Starts the guided tour; resolves false (with a toast) when too few anchors are on screen. */
export async function startTour(root: ParentNode = document): Promise<boolean> {
  await waitForTourAnchors(root);
  const steps = resolveTourSteps(root);
  if (steps.length < MIN_TOUR_STEPS) {
    showToast(TOUR_TOO_FEW_STEPS_MESSAGE);
    return false;
  }

  const view = reactive<PopoverView>({
    step: 1,
    total: steps.length,
    title: '',
    description: '',
  });
  let popoverApp: App | null = null;
  const tour: Driver = driver({
    ...buildConfig(steps, (popover, { state }) => {
      const index = state.activeIndex ?? 0;
      view.step = index + 1;
      view.title = steps[index].title;
      view.description = steps[index].description;
      // driver.js resets the default nodes on every step, so re-hide and re-attach each render.
      popoverApp?.unmount();
      popoverApp = mountPopover(popover, tour, view);
    }),
    onDestroyed: () => {
      popoverApp?.unmount();
      popoverApp = null;
    },
  });
  tour.drive();
  return true;
}
