export const ANALYTICS_EVENTS = {
  DownloadClick: 'download_click',
  DownloadServed: 'download_served',
  FeatureInteraction: 'feature_interaction',
  NavClick: 'nav_click',
  DocsNavigationClick: 'docs_navigation_click',
  DocsInteraction: 'docs_interaction',
  ThemeToggle: 'theme_toggle',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsValue = string | number | boolean | null | undefined;
export type AnalyticsPayload = Record<string, AnalyticsValue>;
