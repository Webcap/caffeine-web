import mixpanel from 'mixpanel-browser';

const isProd = process.env.NODE_ENV === 'production';

export const mixpanelInit = (token: string) => {
  if (!token) {
    console.warn('Mixpanel token is missing, skipping initialization');
    return;
  }

  try {
    mixpanel.init(token, {
      debug: !isProd,
      track_pageview: true,
      persistence: 'localStorage',
    });
    console.log('Mixpanel initialized successfully');
  } catch (e) {
    console.error('Failed to initialize Mixpanel:', e);
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (!isProd) {
      console.log(`Mixpanel track: ${eventName}`, properties || '');
    }
    mixpanel.track(eventName, properties);
  } catch (e) {
    console.error(`Failed to track Mixpanel event: ${eventName}`, e);
  }
};

export const identifyUser = (userId: string) => {
  try {
    if (!isProd) {
      console.log(`Mixpanel identify: ${userId}`);
    }
    mixpanel.identify(userId);
  } catch (e) {
    console.error('Failed to identify Mixpanel user:', e);
  }
};

export const setUserProfile = (properties: Record<string, any>) => {
  try {
    mixpanel.people.set(properties);
  } catch (e) {
    console.error('Failed to set Mixpanel user profile:', e);
  }
};

export const resetMixpanel = () => {
  try {
    mixpanel.reset();
  } catch (e) {
    console.error('Failed to reset Mixpanel:', e);
  }
};

export default mixpanel;
