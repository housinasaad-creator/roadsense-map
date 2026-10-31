// Connection to the Supabase project. The anon key is public by design: the database rules (RLS) decide what it may do.
window.ROADSENSE = {
  url: 'https://vdonusyzntffgrvfsdeq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkb251c3l6bnRmZmdydmZzZGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NzU5NzEsImV4cCI6MjEwODQ1MTk3MX0.E-B6vjF9Qcg5cLawFpImMAQrJHk15I-vEutpU1Mlis8',
  center: [34.5603, 38.2701], // map start (Palmyra); fitted to the reports once they load
  zoom: 12,
  tgBot: 'PRU_SamaTadmor_bot', // the Telegram bot that receives the notifications
  cartoKey: '',                // free CARTO basemaps key (request at https://carto.com/basemaps/apikey/ , it is e-mailed, no account). Empty = the CARTO layer stays off (without a key CARTO draws an "API KEY REQUIRED" watermark).
  googleKey: '',               // official Google Maps Platform key with the Map Tiles API enabled (billing must be on). Empty = the two Google layers stay off; "open in Google Maps" links still work.
};
