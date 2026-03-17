import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rss, ExternalLink, Clock, RefreshCw, Globe, AlertTriangle, Filter, Search } from 'lucide-react';

// ─── Feed sources ─────────────────────────────────────────────────────────────
const FEEDS = [
  { id: 'thehackernews',  label: 'The Hacker News',   color: '#00FF9C', url: 'https://feeds.feedburner.com/TheHackersNews' },
  { id: 'krebsonsecurity',label: 'Krebs on Security',  color: '#60A5FA', url: 'https://krebsonsecurity.com/feed/' },
  { id: 'bleepingcomputer',label: 'BleepingComputer',  color: '#A78BFA', url: 'https://www.bleepingcomputer.com/feed/' },
  { id: 'securityweek',   label: 'SecurityWeek',      color: '#FBBF24', url: 'https://feeds.feedburner.com/securityweek' },
  { id: 'darkreading',    label: 'Dark Reading',      color: '#F87171', url: 'https://www.darkreading.com/rss.xml' },
];

// CORS proxy — free and reliable
const PROXY = 'https://api.allorigins.win/get?url=';

// ─── Parse RSS XML string ──────────────────────────────────────────────────────
function parseRSS(xmlStr, feedId) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item'));
    return items.slice(0, 15).map(item => {
      const get = tag => item.querySelector(tag)?.textContent?.trim() ?? '';
      // RSS link element is tricky — try multiple approaches
      const rawLink = get('link') || (item.querySelector('link')?.nextSibling?.textContent?.trim()) || '';
      const imgMatch = get('description').match(/<img[^>]+src=["']([^"']+)["']/);
      const enclosure = item.querySelector('enclosure');
      const mediaThumbnail = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
      return {
        feedId,
        title: get('title'),
        link: rawLink,
        pubDate: get('pubDate'),
        description: get('description').replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').slice(0, 220),
        thumbnail: mediaThumbnail?.getAttribute('url') ?? enclosure?.getAttribute('url') ?? imgMatch?.[1] ?? null,
      };
    }).filter(a => a.title && a.link);
  } catch {
    return [];
  }
}

// ─── Fetch one feed — tries multiple proxies ──────────────────────────────────
async function fetchFeed(feed) {
  // Strategy 1: codetabs.com (returns raw XML)
  try {
    const res = await fetch(
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feed.url)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const xml = await res.text();
      const items = parseRSS(xml, feed.id);
      if (items.length > 0) return items;
    }
  } catch { /* fall through */ }

  // Strategy 2: allorigins.win (returns { contents: xmlString })
  try {
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const json = await res.json();
      const items = parseRSS(json.contents, feed.id);
      if (items.length > 0) return items;
    }
  } catch { /* fall through */ }

  // Strategy 3: rss2json.com as last resort
  try {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=15`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.items?.length > 0) {
        return data.items.map(item => ({
          feedId: feed.id,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 220),
          thumbnail: item.thumbnail || null,
        })).filter(a => a.title && a.link);
      }
    }
  } catch { /* all strategies failed */ }

  return [];
}

// ─── Time ago helper ───────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Article card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, feed, index }) {
  return (
    <motion.a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      whileHover={{ y: -3 }}
      className="group flex flex-col gap-3 p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ background: feed.color }} />

      {/* Source + Time */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-full border flex-shrink-0"
          style={{ color: feed.color, borderColor: `${feed.color}40`, background: `${feed.color}10` }}>
          {feed.label}
        </span>
        {article.pubDate && (
          <span className="text-xs text-gray-500 font-mono flex items-center gap-1 flex-shrink-0">
            <Clock size={11} /> {timeAgo(article.pubDate)}
          </span>
        )}
      </div>

      {/* Thumbnail */}
      {article.thumbnail && (
        <div className="w-full h-32 rounded-xl overflow-hidden bg-white/5">
          <img src={article.thumbnail} alt="" className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"
            onError={e => { e.target.parentElement.style.display = 'none'; }} />
        </div>
      )}

      {/* Title */}
      <h3 className="font-heading font-bold text-white text-base leading-snug group-hover:text-kavach-green transition-colors line-clamp-2">
        {article.title}
      </h3>

      {/* Excerpt */}
      {article.description && (
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
          {article.description}
        </p>
      )}

      {/* Read more */}
      <div className="flex items-center gap-1 mt-auto text-xs font-black uppercase tracking-wide opacity-30 group-hover:opacity-100 transition-opacity"
        style={{ color: feed.color }}>
        <ExternalLink size={11} /> Read full article
      </div>
    </motion.a>
  );
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-black/40 border border-white/5 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-32 bg-white/5 rounded-full" />
        <div className="h-4 w-12 bg-white/5 rounded-full" />
      </div>
      <div className="h-28 w-full bg-white/5 rounded-xl" />
      <div className="h-4 w-full bg-white/5 rounded" />
      <div className="h-4 w-3/4 bg-white/5 rounded" />
      <div className="h-3 w-5/6 bg-white/5 rounded" />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function News() {
  const [articles, setArticles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingFeeds, setLoadingFeeds] = useState(new Set(FEEDS.map(f => f.id)));
  const [activeSource, setActiveSource] = useState('ALL');
  const [search, setSearch]           = useState('');
  const [refreshKey, setRefreshKey]   = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    setLoading(true);
    setArticles([]);
    setLoadingFeeds(new Set(FEEDS.map(f => f.id)));

    let allArticles = [];

    FEEDS.forEach(feed => {
      fetchFeed(feed).then(items => {
        allArticles = [...allArticles, ...items];
        setLoadingFeeds(prev => {
          const next = new Set(prev);
          next.delete(feed.id);
          return next;
        });
        setArticles(
          [...allArticles].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        );
        if (allArticles.length > 0) setLoading(false);
      });
    });

    // Fallback: stop loading after 12s regardless
    const t = setTimeout(() => {
      setLoading(false);
      setLoadingFeeds(new Set());
      setLastRefreshed(new Date());
    }, 12000);

    setLastRefreshed(new Date());
    return () => clearTimeout(t);
  }, [refreshKey]);

  // When all feeds done loading
  useEffect(() => {
    if (loadingFeeds.size === 0) setLoading(false);
  }, [loadingFeeds]);

  const filtered = articles.filter(a => {
    const matchSource = activeSource === 'ALL' || a.feedId === activeSource;
    const matchSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    return matchSource && matchSearch;
  });

  const getFeed = id => FEEDS.find(f => f.id === id);
  const stillLoading = loadingFeeds.size > 0;

  return (
    <div className="space-y-6 pt-24 md:pt-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-kavach-green/10 border border-kavach-green/20">
            <Rss size={20} className="text-kavach-green" />
          </div>
          <div>
            <h1 className="font-orbitron font-black text-white text-xl tracking-tight uppercase">
              Cyber <span className="text-kavach-green">Intelligence</span> Feed
            </h1>
            <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">
              Live · {FEEDS.length} sources ·
              {stillLoading ? ' Fetching...' : ` ${articles.length} articles`}
              {lastRefreshed && !stillLoading && ` · ${timeAgo(lastRefreshed)}`}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={stillLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-kavach-green hover:border-kavach-green/30 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
        >
          <motion.div animate={stillLoading ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw size={13} />
          </motion.div>
          {stillLoading ? 'Loading...' : 'Refresh'}
        </motion.button>
      </motion.div>

      {/* Feed status pills */}
      <div className="flex flex-wrap gap-2">
        {FEEDS.map(feed => {
          const isLoading = loadingFeeds.has(feed.id);
          const count = articles.filter(a => a.feedId === feed.id).length;
          return (
            <div key={feed.id} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black/30 border border-white/5 text-sm font-mono">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isLoading ? 'animate-pulse bg-yellow-400' : count > 0 ? 'bg-kavach-green' : 'bg-red-500'}`} />
              <span style={{ color: feed.color }} className="font-bold">{feed.label}</span>
              {!isLoading && <span className="text-gray-500 text-xs">({count})</span>}
            </div>
          );
        })}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus-within:border-kavach-green/30 transition-all flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="text-gray-500 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 bg-transparent font-mono text-sm text-gray-300 placeholder:text-gray-700 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1"><Filter size={11}/> Source:</span>
          {[{ id:'ALL', label:'All', color:'#00FF9C' }, ...FEEDS].map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSource(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide border transition-all ${
                activeSource === s.id ? 'text-black' : 'border-white/10 text-gray-500 hover:text-white'
              }`}
              style={activeSource === s.id ? { background: s.color, borderColor: s.color } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles grid — shows progressive loading */}
      {loading && articles.length === 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-5"><SkeletonCard /></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Globe size={48} className="text-kavach-green opacity-20" />
          <p className="font-orbitron text-white text-lg uppercase tracking-widest">No articles found</p>
          <p className="text-gray-600 text-sm">Try a different source or search term.</p>
          {articles.length === 0 && (
            <button onClick={() => setRefreshKey(k => k + 1)}
              className="mt-2 px-5 py-2.5 rounded-xl bg-kavach-green text-black font-orbitron font-black text-[10px] uppercase tracking-widest">
              Retry
            </button>
          )}
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {filtered.map((article, i) => {
            const feed = getFeed(article.feedId);
            if (!feed) return null;
            return (
              <div key={`${article.feedId}-${article.link}-${i}`} className="break-inside-avoid mb-5">
                <ArticleCard article={article} feed={feed} index={i} />
              </div>
            );
          })}
          {/* Show skeletons for feeds still loading */}
          {stillLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={`sk-${i}`} className="break-inside-avoid mb-5"><SkeletonCard /></div>
          ))}
        </div>
      )}
    </div>
  );
}