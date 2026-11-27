import { Hr, Text } from '@react-email/components';
import { FEEDBACK_DIGEST_WINDOW_DAYS, FEEDBACK_RATING_MAX } from '@visual-ai/shared';

import { CtaButton } from './components/CtaButton.js';
import { EmailShell } from './components/EmailShell.js';
import { eyebrowStyle } from './components/styles.js';
import { BRAND_NAME, COLORS, FONT_SIZE, SPACE } from './constants.js';

export type RatingTrend = 'up' | 'down' | 'flat';

export interface FeedbackDigestIdea {
  message: string;
}

export interface FeedbackDigestQuote {
  quote: string;
  displayName: string;
}

export interface FeedbackDigestData {
  periodLabel: string;
  totalCount: number;
  countByType: Record<string, number>;
  avgRating: number | null;
  /** Null when there are no ratings in the previous window to compare against. */
  ratingTrend: RatingTrend | null;
  ratingDelta: number | null;
  newIdeas: FeedbackDigestIdea[];
  quotes: FeedbackDigestQuote[];
  adminUrl: string;
}

const TREND_LABEL: Record<RatingTrend, string> = {
  up: 'up',
  down: 'down',
  flat: 'flat',
};
const RATING_DECIMALS = 1;

const headingStyle = {
  fontSize: `${FONT_SIZE.title}px`,
  lineHeight: '28px',
  fontWeight: 800,
  color: COLORS.text,
  margin: `${SPACE.xxs}px 0 ${SPACE.sm}px`,
} as const;
const sectionTitleStyle = { ...eyebrowStyle, margin: `${SPACE.md}px 0 ${SPACE.xs}px` } as const;
const lineStyle = {
  fontSize: `${FONT_SIZE.body}px`,
  lineHeight: '24px',
  color: COLORS.text,
  margin: `0 0 ${SPACE.xxs}px`,
} as const;
const mutedStyle = { ...lineStyle, color: COLORS.muted } as const;

export function feedbackDigestSubject({ periodLabel, totalCount }: FeedbackDigestData) {
  return `[${BRAND_NAME}] Weekly feedback digest: ${totalCount} new (${periodLabel})`;
}

function ratingLine({ avgRating, ratingTrend, ratingDelta }: FeedbackDigestData): string {
  if (avgRating === null) return 'No ratings this week.';
  const base = `Average rating ${avgRating.toFixed(RATING_DECIMALS)} / ${FEEDBACK_RATING_MAX}`;
  if (ratingTrend === null || ratingDelta === null) return base;
  const delta = Math.abs(ratingDelta).toFixed(RATING_DECIMALS);
  return `${base}, ${TREND_LABEL[ratingTrend]} ${delta} vs the previous ${FEEDBACK_DIGEST_WINDOW_DAYS} days`;
}

export function FeedbackDigest(data: FeedbackDigestData) {
  const { totalCount, countByType, newIdeas, quotes, adminUrl, periodLabel } = data;
  const typeEntries = Object.entries(countByType);

  return (
    <EmailShell
      title={feedbackDigestSubject(data)}
      preview={`${totalCount} new feedback items ${periodLabel}`}
    >
      <Text style={eyebrowStyle}>Weekly digest</Text>
      <Text style={headingStyle}>{`${totalCount} new feedback items`}</Text>
      <Text style={mutedStyle}>{periodLabel}</Text>

      <Text style={sectionTitleStyle}>By type</Text>
      {typeEntries.length === 0 ? (
        <Text style={mutedStyle}>Nothing new this week.</Text>
      ) : (
        typeEntries.map(([type, count]) => (
          <Text key={type} style={lineStyle}>{`${type}: ${count}`}</Text>
        ))
      )}

      <Text style={sectionTitleStyle}>Rating</Text>
      <Text style={lineStyle}>{ratingLine(data)}</Text>

      {newIdeas.length > 0 ? (
        <>
          <Text style={sectionTitleStyle}>New ideas</Text>
          {newIdeas.map((idea, index) => (
            <Text key={index} style={lineStyle}>{`- ${idea.message}`}</Text>
          ))}
        </>
      ) : null}

      {quotes.length > 0 ? (
        <>
          <Text style={sectionTitleStyle}>Quotable feedback</Text>
          {quotes.map((entry, index) => (
            <Text key={index} style={lineStyle}>{`"${entry.quote}" - ${entry.displayName}`}</Text>
          ))}
        </>
      ) : null}

      <Hr style={{ borderColor: COLORS.border, margin: `${SPACE.md}px 0` }} />
      <CtaButton href={adminUrl}>Open feedback admin</CtaButton>
    </EmailShell>
  );
}

FeedbackDigest.PreviewProps = {
  periodLabel: 'Mar 3 - Mar 10',
  totalCount: 7,
  countByType: { rating: 4, bug: 1, idea: 2 },
  avgRating: 4.25,
  ratingTrend: 'up',
  ratingDelta: 0.5,
  newIdeas: [{ message: 'Batch export to zip' }],
  quotes: [{ quote: 'Love the new studio', displayName: 'Alex' }],
  adminUrl: 'https://visual-ai.app/admin/feedback',
} satisfies FeedbackDigestData;

export default FeedbackDigest;
