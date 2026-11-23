# Header menus, studio routes and mini-player persistence

# evidence: src/components/Header/NavTabs.vue, NavMenuGroup.vue, NavMobileAccordion.vue, src/router/index.ts, src/stores/player.ts, src/components/Audio/MiniPlayer.vue, TrackCard.vue, src/composables/useGlobalShortcuts.ts, src/components/History/History.vue, e2e/fixtures/media.ts

## @critical Each Audio and Tools menu item navigates to its route.

## @critical Keyboard-only run opens Audio, moves, activates and Escape returns focus.

## @critical Signed-out visit to /audio/song redirects to sign-in.

## @critical A track started from a History card keeps playing across navigation and a second track pauses the first.

## @high Space toggles the active player and ? opens the shortcuts popover.

## @high 375px accordion items are at least 44px and there is no horizontal scroll.

## @high History shows a stubbed fake asset with the Song filter.

## @medium Image tab still opens create.
