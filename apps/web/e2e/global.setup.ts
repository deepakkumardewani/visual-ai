import { clerkSetup } from '@clerk/testing/playwright';

import { runPreflight } from './support/preflight';

export default async function globalSetup() {
  await runPreflight();
  await clerkSetup();
}
