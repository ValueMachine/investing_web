export async function getQuote(symbol: string) {
  const API_KEY = import.meta.env.VITE_FINNHUB_KEY;
  if (!API_KEY) {
    console.warn("Finnhub API Key is missing. Skipping quote fetch.");
    return null;
  }
  
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`);
    if (!res.ok) {
      console.error(`Failed to fetch quote for ${symbol}: ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return null;
  }
}
