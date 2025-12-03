export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { stats, recentCandles } = await request.json();

    const lastClose = recentCandles[recentCandles.length - 1]?.close || stats.currentPrice;
    const thirtyDaysAgo = recentCandles[recentCandles.length - 30]?.close || lastClose;
    const change30d = ((lastClose - thirtyDaysAgo) / thirtyDaysAgo) * 100;

    const prompt = `
      Act as an expert crypto analyst specializing in the "BTC 100-Day Bull Run Theory".

      The Theory:
      - A rapid, unilateral rise typically lasts ~100 days.
      - Phases: Observation (0-30d), Confirmation (30-70d), Warning (70-100d).

      Current Data:
      - Price: $${stats.currentPrice.toLocaleString()}
      - 24h Change: ${stats.change24hPercent.toFixed(2)}%
      - 30d Trend: ${change30d.toFixed(2)}%

      Task:
      Analyze if we are currently in a potential "100-day cycle".
      If trending up strongly, estimate which phase we might be in.
      If trending down or sideways, mention we are likely in a "Rest" phase.

      IMPORTANT: Please reply in Chinese (Simplified). Keep it concise (max 3 sentences). Professional tone.
    `;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      })
    });

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "暂时无法生成分析。";

    return new Response(JSON.stringify({ insight }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ insight: "AI 分析服务暂时不可用。" }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}