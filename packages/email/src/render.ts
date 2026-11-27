import { render } from '@react-email/render';
import { createElement, type ReactElement } from 'react';

import { FeedbackAlert, type FeedbackAlertData } from './FeedbackAlert.js';
import { FeedbackDigest, type FeedbackDigestData } from './FeedbackDigest.js';
import { V2Announcement, type V2AnnouncementData } from './V2Announcement.js';

export interface RenderedEmail {
  html: string;
  text: string;
}

async function renderElement(element: ReactElement): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}

export function renderV2Announcement(data: V2AnnouncementData): Promise<RenderedEmail> {
  return renderElement(createElement(V2Announcement, data));
}

export function renderFeedbackAlert(data: FeedbackAlertData): Promise<RenderedEmail> {
  return renderElement(createElement(FeedbackAlert, data));
}

export function renderFeedbackDigest(data: FeedbackDigestData): Promise<RenderedEmail> {
  return renderElement(createElement(FeedbackDigest, data));
}
