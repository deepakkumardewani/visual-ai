import { render } from '@react-email/render';
import { createElement } from 'react';

import { V2Announcement, type V2AnnouncementData } from './V2Announcement.js';

export interface RenderedEmail {
  html: string;
  text: string;
}

export async function renderV2Announcement(data: V2AnnouncementData): Promise<RenderedEmail> {
  const element = createElement(V2Announcement, data);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}
