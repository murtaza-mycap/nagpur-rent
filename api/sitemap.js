// Vercel serverless function — generates sitemap dynamically
// Accessible at: nagpur.rent/api/sitemap
// But we redirect /sitemap.xml → this via vercel.json

export default async function handler(req, res) {
  const SUPABASE_URL = 'https://artqzjmizytoxxaqzadw.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydHF6am1penl0b3h4YXF6YWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MjE2MDQsImV4cCI6MjA5MTE5NzYwNH0.dVluFoXQGAKKFUL894F-R-VoITCD14vVJ6R2YyGiYzE';
  const BASE = 'https://nagpur.rent';
  const today = new Date().toISOString().split('T')[0];

  // Static pages
  const staticPages = [
    { url: '/',              priority: '1.0', changefreq: 'daily'   },
    { url: '/listings.html', priority: '0.9', changefreq: 'weekly'  },
    { url: '/blog.html',     priority: '0.8', changefreq: 'weekly'  },
    { url: '/about.html',    priority: '0.6', changefreq: 'monthly' },
  ];

  // Seed entries (always included)
  const seedListings = [
    { slug: 'premium-commercial-space-ca-road', updated: today }
  ];
  const seedPosts = [
    { slug: 'what-is-nagpur-rent', updated: today }
  ];

  // Fetch from Supabase
  let listings = [], posts = [];
  try {
    const [lRes, pRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/paid_listings?select=slug,updated_at&active=eq.true&slug=not.is.null`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at&published=eq.true&slug=not.is.null`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      })
    ]);
    listings = await lRes.json();
    posts = await pRes.json();
  } catch (e) {
    // If fetch fails, fall back to seeds only
  }

  // Merge seeds with DB results, deduplicate
  const allListings = [...seedListings, ...(Array.isArray(listings) ? listings : [])]
    .filter((l, i, arr) => arr.findIndex(x => x.slug === l.slug) === i);
  const allPosts = [...seedPosts, ...(Array.isArray(posts) ? posts : [])]
    .filter((p, i, arr) => arr.findIndex(x => x.slug === p.slug) === i);

  const urls = [
    ...staticPages.map(p => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...allListings.map(l => `
  <url>
    <loc>${BASE}/listing/${l.slug}</loc>
    <lastmod>${(l.updated_at||l.updated||today).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ...allPosts.map(p => `
  <url>
    <loc>${BASE}/blog/${p.slug}</loc>
    <lastmod>${(p.updated_at||p.updated||today).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
}
