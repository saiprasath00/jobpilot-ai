export const countries = {
  India: ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'],
  'United States': ['New York', 'San Francisco', 'Los Angeles', 'Seattle', 'Austin', 'Boston', 'Chicago'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'],
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  France: ['Paris', 'Lyon', 'Marseille'],
  Netherlands: ['Amsterdam', 'Rotterdam', 'Utrecht'],
  Ireland: ['Dublin', 'Cork', 'Galway'],
  Singapore: ['Singapore'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch'],
  'South Africa': ['Cape Town', 'Johannesburg', 'Durban'],
  Brazil: ['São Paulo', 'Rio de Janeiro', 'Brasília'],
  Mexico: ['Mexico City', 'Guadalajara', 'Monterrey'],
  Japan: ['Tokyo', 'Osaka', 'Kyoto']
};
const aliases = {'United States':['USA','US','U.S.','United States of America'], 'United Kingdom':['UK','U.K.','Britain'], 'United Arab Emirates':['UAE'], Germany:['Deutschland'], Bengaluru:['Bangalore'], Munich:['München'], Cologne:['Köln'], 'New York':['NYC'], 'San Francisco':['SF'], Delhi:['New Delhi'], 'São Paulo':['Sao Paulo'], Montreal:['Montréal']};
const normalize = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const contains = (text, value) => (' '+normalize(text)+' ').includes(' '+normalize(value)+' ');
const matches = (text, value) => [value,...(aliases[value]||[])].some(v=>contains(text,v));
export function matchesLocation(job, pref={}) {
  const location=job.location||'';
  const remote=job.remote===true||job.source==='Remotive'||contains(job.type,'remote')||contains(location,'remote');
  if(pref.workplace==='remote'&&!remote)return false;
  if(pref.workplace==='onsite'&&remote)return false;
  const city=(pref.city||'').trim(),country=pref.country||'';
  if(!city&&!country)return true;
  // Worldwide remote roles are included; region-restricted roles need explicit location evidence.
  if(remote&&/\b(worldwide|anywhere|global)\b/i.test(location))return true;
  if(city)return matches(location,city);
  return matches(location,country)||(countries[country]||[]).some(c=>matches(location,c));
}
export function locationQuery(pref={}){return [pref.city,pref.country].filter(Boolean).join(', ')}
