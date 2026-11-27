import { Hr, Text } from '@react-email/components';
import { FEEDBACK_RATING_MAX } from '@visual-ai/shared';

import { CtaButton } from './components/CtaButton.js';
import { EmailShell } from './components/EmailShell.js';
import { eyebrowStyle } from './components/styles.js';
import { BRAND_NAME, COLORS, FONT_SIZE, SPACE } from './constants.js';

export interface FeedbackAlertData {
  type: string;
  rating?: number;
  message: string;
  userEmail: string;
  route?: string;
  plan?: string;
  adminUrl: string;
}

const NO_MESSAGE_TEXT = '(no message)';

const titleStyle = {
  fontSize: `${FONT_SIZE.title}px`,
  lineHeight: '28px',
  fontWeight: 800,
  color: COLORS.text,
  margin: `${SPACE.xxs}px 0 ${SPACE.sm}px`,
} as const;
const messageStyle = {
  fontSize: `${FONT_SIZE.body}px`,
  lineHeight: '24px',
  color: COLORS.text,
  backgroundColor: COLORS.accentTint,
  borderLeft: `3px solid ${COLORS.accent}`,
  padding: `${SPACE.sm}px`,
  margin: `0 0 ${SPACE.sm}px`,
  whiteSpace: 'pre-wrap',
} as const;
const metaStyle = {
  fontSize: `${FONT_SIZE.small + 1}px`,
  lineHeight: '20px',
  color: COLORS.muted,
  margin: 0,
} as const;

export function feedbackAlertSubject({ type, rating }: Pick<FeedbackAlertData, 'type' | 'rating'>) {
  const detail = rating === undefined ? type : `${rating}/${FEEDBACK_RATING_MAX} ${type}`;
  return `[${BRAND_NAME}] New feedback: ${detail}`;
}

export function FeedbackAlert(data: FeedbackAlertData) {
  const { type, rating, message, userEmail, route, plan, adminUrl } = data;
  const heading =
    rating === undefined ? `New ${type} report` : `New ${rating}/${FEEDBACK_RATING_MAX} rating`;

  return (
    <EmailShell title={feedbackAlertSubject(data)} preview={`${heading} from ${userEmail}`}>
      <Text style={eyebrowStyle}>Feedback alert</Text>
      <Text style={titleStyle}>{heading}</Text>
      <Text style={messageStyle}>{message.trim() || NO_MESSAGE_TEXT}</Text>
      <Hr style={{ borderColor: COLORS.border, margin: `${SPACE.sm}px 0` }} />
      <Text style={metaStyle}>{`From: ${userEmail}`}</Text>
      {route ? <Text style={metaStyle}>{`Page: ${route}`}</Text> : null}
      {plan ? <Text style={metaStyle}>{`Plan: ${plan}`}</Text> : null}
      <Text style={{ margin: `${SPACE.sm}px 0 0` }} />
      <CtaButton href={adminUrl}>Open in admin</CtaButton>
    </EmailShell>
  );
}

FeedbackAlert.PreviewProps = {
  type: 'bug',
  rating: 1,
  message: 'The upscaler hangs at 90%.',
  userEmail: 'alex@example.com',
  route: '/create/image',
  plan: 'free',
  adminUrl: 'https://visual-ai.app/admin/feedback',
} satisfies FeedbackAlertData;

export default FeedbackAlert;
