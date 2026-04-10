(async function(){
  const SUPABASE_URL='https://artqzjmizytoxxaqzadw.supabase.co';
  const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydHF6am1penl0b3h4YXF6YWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MjE2MDQsImV4cCI6MjA5MTE5NzYwNH0.dVluFoXQGAKKFUL894F-R-VoITCD14vVJ6R2YyGiYzE';

  // ── STATIC SCHEMA (always injected, no DB needed) ──
  const SCHEMA={
    "@context":"https://schema.org",
    "@type":"LocalBusiness",
    "name":"nagpur.rent",
    "description":"Community rental price map for Nagpur. Real rents shared anonymously by residents. No broker, no login.",
    "url":"https://nagpur.rent",
    "telephone":"+917350299845",
    "email":"murtaza.mycap@gmail.com",
    "address":{"@type":"PostalAddress","addressLocality":"Nagpur","addressRegion":"Maharashtra","addressCountry":"IN"},
    "geo":{"@type":"GeoCoordinates","latitude":"21.1458","longitude":"79.0882"},
    "areaServed":{"@type":"City","name":"Nagpur"},
    "sameAs":["https://instagram.com/nagpurrent"]
  };
  injectSchema(SCHEMA);

  // ── FETCH SCRIPTS FROM SUPABASE ──
  try{
    const res=await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?key=in.(head_scripts,gtm_id,fb_pixel_id,meta_verification,bing_verification,clarity_id,custom_head_scripts)&select=key,value`,
      {headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}}
    );
    if(!res.ok)return;
    const rows=await res.json();
    const s={};
    rows.forEach(r=>{if(r.value&&r.value.trim())s[r.key]=r.value.trim();});

    // Google Tag Manager
    if(s.gtm_id){
      injectGTM(s.gtm_id);
    }

    // Facebook Pixel
    if(s.fb_pixel_id){
      injectFBPixel(s.fb_pixel_id);
    }

    // Microsoft Clarity
    if(s.clarity_id){
      injectClarity(s.clarity_id);
    }

    // Google Search Console verification
    if(s.meta_verification){
      injectMeta('google-site-verification', s.meta_verification);
    }

    // Bing Webmaster verification
    if(s.bing_verification){
      injectMeta('msvalidate.01', s.bing_verification);
    }

    // Custom head scripts (raw HTML — paste anything here)
    if(s.custom_head_scripts){
      injectRaw(s.custom_head_scripts);
    }

  }catch(e){
    // Silent fail — never break the page
  }

  // ── HELPERS ──

  function injectSchema(obj){
    const el=document.createElement('script');
    el.type='application/ld+json';
    el.textContent=JSON.stringify(obj,null,2);
    document.head.appendChild(el);
  }

  function injectGTM(id){
    // GTM head script
    const s=document.createElement('script');
    s.textContent=`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
    document.head.appendChild(s);
    // GTM body noscript — inject after body opens
    const ns=document.createElement('noscript');
    const iframe=document.createElement('iframe');
    iframe.src=`https://www.googletagmanager.com/ns.html?id=${id}`;
    iframe.height='0';iframe.width='0';iframe.style.cssText='display:none;visibility:hidden';
    ns.appendChild(iframe);
    document.body.insertBefore(ns,document.body.firstChild);
  }

  function injectFBPixel(id){
    const s=document.createElement('script');
    s.textContent=`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
    document.head.appendChild(s);
    // Noscript fallback
    const ns=document.createElement('noscript');
    ns.innerHTML=`<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/>`;
    document.head.appendChild(ns);
  }

  function injectClarity(id){
    const s=document.createElement('script');
    s.textContent=`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${id}");`;
    document.head.appendChild(s);
  }

  function injectMeta(name,content){
    if(document.querySelector(`meta[name="${name}"]`))return;
    const m=document.createElement('meta');
    m.name=name;m.content=content;
    document.head.appendChild(m);
  }

  function injectRaw(html){
    // Parse and inject custom HTML safely
    const tmp=document.createElement('div');
    tmp.innerHTML=html;
    // Inject scripts
    tmp.querySelectorAll('script').forEach(orig=>{
      const s=document.createElement('script');
      if(orig.src)s.src=orig.src;
      else s.textContent=orig.textContent;
      if(orig.async)s.async=true;
      if(orig.defer)s.defer=true;
      document.head.appendChild(s);
    });
    // Inject meta tags
    tmp.querySelectorAll('meta').forEach(m=>{
      document.head.appendChild(m.cloneNode());
    });
    // Inject link tags
    tmp.querySelectorAll('link').forEach(l=>{
      document.head.appendChild(l.cloneNode());
    });
  }

})();
