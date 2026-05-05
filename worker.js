/**
 * Yahoo Finance Proxy - Cloudflare Worker
 * Deploy: https://dash.cloudflare.com → Workers & Pages → Create
 *
 * 엔드포인트:
 *   GET /yahoo/chart/{ticker}        - 시세 (price, prevClose 등)
 *   GET /yahoo/quoteSummary/{ticker} - 재무지표 (PER, PBR, ROE 등)
 *
 * 예시:
 *   /yahoo/chart/005930.KS
 *   /yahoo/chart/AAPL
 *   /yahoo/quoteSummary/TSLA
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      // /yahoo/chart/{ticker}?range=1mo&interval=1d
      const chartMatch = path.match(/^\/yahoo\/chart\/(.+)$/);
      if (chartMatch) {
        const ticker = decodeURIComponent(chartMatch[1]);
        const range = url.searchParams.get('range') || '5d';
        const interval = url.searchParams.get('interval') || '1d';
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
        const res = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      // /yahoo/quoteSummary/{ticker}
      const summaryMatch = path.match(/^\/yahoo\/quoteSummary\/(.+)$/);
      if (summaryMatch) {
        const ticker = decodeURIComponent(summaryMatch[1]);
        const modules = 'price,summaryDetail,defaultKeyStatistics,financialData,assetProfile';
        const yahooUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`;
        const res = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      // Health check
      if (path === '/' || path === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          endpoints: ['/yahoo/chart/{ticker}', '/yahoo/quoteSummary/{ticker}'],
          examples: ['/yahoo/chart/005930.KS', '/yahoo/quoteSummary/AAPL'],
        }, null, 2), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found', path }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }
  },
};
