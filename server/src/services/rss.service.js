import Parser from 'rss-parser';
import { logger } from '../utils/logger.js';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'QuizBot/1.0 (+https://quizgame.app)' },
});

/**
 * RSS feed sources mapped by topic slug.
 * Each topic has multiple feed URLs for variety.
 */
export const TOPIC_FEEDS = {
  'ai-ml': [
    'https://feeds.feedburner.com/venturebeat/SZYF',          // VentureBeat AI
    'https://www.technologyreview.com/feed/',                  // MIT Tech Review
    'https://aiweekly.co/issues.rss',                          // AI Weekly
  ],
  'cybersecurity': [
    'https://feeds.feedburner.com/TheHackersNews',             // The Hacker News
    'https://www.darkreading.com/rss.xml',                     // Dark Reading
    'https://krebsonsecurity.com/feed/',                       // Krebs on Security
  ],
  'web-dev': [
    'https://www.smashingmagazine.com/feed/',                  // Smashing Magazine
    'https://dev.to/feed',                                     // Dev.to
    'https://css-tricks.com/feed/',                            // CSS-Tricks
  ],
  'cloud': [
    'https://thenewstack.io/feed/',                            // The New Stack
    'https://cloudblog.withgoogle.com/rss/',                   // Google Cloud Blog
    'https://aws.amazon.com/blogs/aws/feed/',                  // AWS Blog
  ],
  'startups': [
    'https://techcrunch.com/feed/',                            // TechCrunch
    'https://news.ycombinator.com/rss',                        // Hacker News
  ],
  'hardware': [
    'https://www.tomshardware.com/feeds/all',                  // Tom's Hardware
    'https://arstechnica.com/gadgets/feed/',                   // Ars Technica Gadgets
  ],
  'mobile': [
    'https://9to5google.com/feed/',                            // 9to5Google
    'https://www.macrumors.com/macrumors.xml',                 // MacRumors
  ],
  'open-source': [
    'https://github.blog/feed/',                               // GitHub Blog
    'https://opensource.com/feed',                             // Opensource.com
  ],
};

export const TOPIC_META = {
  'ai-ml':         { label: '🤖 AI & Machine Learning', color: '#6366f1' },
  'cybersecurity': { label: '🔐 Cybersecurity',          color: '#ef4444' },
  'web-dev':       { label: '🌐 Web Development',        color: '#3b82f6' },
  'cloud':         { label: '☁️ Cloud & DevOps',          color: '#06b6d4' },
  'startups':      { label: '🚀 Startups & Tech',        color: '#f59e0b' },
  'hardware':      { label: '🖥️ Hardware & Chips',        color: '#8b5cf6' },
  'mobile':        { label: '📱 Mobile & Apps',           color: '#10b981' },
  'open-source':   { label: '🧩 Open Source',            color: '#f97316' },
};

/**
 * Fetches and parses articles from the RSS feeds of the given topics.
 * Returns an array of normalized article objects.
 *
 * @param {string[]} topics - Array of topic slugs
 * @param {number}   maxPerFeed - Max articles to pull per feed
 */
export async function fetchArticlesByTopics(topics = [], maxPerFeed = 5) {
  const results = [];

  for (const topic of topics) {
    const feeds = TOPIC_FEEDS[topic];
    if (!feeds) {
      logger.warn(`Unknown topic slug: "${topic}"`);
      continue;
    }

    for (const feedUrl of feeds) {
      try {
        logger.debug(`Fetching RSS: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);

        const articles = feed.items.slice(0, maxPerFeed).map((item) => ({
          topic,
          title:     item.title?.trim()   || '',
          summary:   item.contentSnippet?.trim()
                     || item.content?.replace(/<[^>]+>/g, '').slice(0, 300).trim()
                     || '',
          url:       item.link || '',
          published: item.pubDate || item.isoDate || '',
          source:    feed.title || feedUrl,
        }));

        // Filter out articles with too little content for LLM to work with
        results.push(...articles.filter((a) => a.title.length > 20 && a.summary.length > 30));
      } catch (err) {
        logger.warn(`RSS fetch failed for ${feedUrl}: ${err.message}`);
        // Continue with other feeds on failure
      }
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  return results.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}
