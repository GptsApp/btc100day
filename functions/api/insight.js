export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env?.API_KEY) {
      return new Response(JSON.stringify({
        insight: "API密钥未配置，请检查环境变量设置。"
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { analysis, stats, lang = 'zh' } = await request.json();

    const stageNames = lang === 'en' ? {
      observation: 'Observation (0-30 days)',
      confirmation: 'Confirmation (30-70 days)',
      warning: 'Warning (70-100 days)',
      rest: 'Rest Period'
    } : {
      observation: '观察期 (0-30天)',
      confirmation: '确认期 (30-70天)',
      warning: '预警期 (70-100天)',
      rest: '休息期'
    };

    const prompt = lang === 'en' ?
      `You are an expert analyst of the BTC 100-Day Cycle Theory.

**Core Theory**:
- Unilateral rapid rises typically last about 100 days to reach peaks
- Four stages: Observation (0-30 days), Confirmation (30-70 days), Warning (70-100 days), Rest Period
- Based on Bayesian thinking for dynamic probability assessment, not mechanical day counting

**Current Market Data** (processed, no calculation needed):
- BTC Price: $${stats.currentPrice.toLocaleString()}
- 24h Change: ${stats.change24hPercent.toFixed(2)}%

**Technical Analysis Results**:
- Current Stage: ${stageNames[analysis.stage]}
- Probability Assessment: ${analysis.probability}%
- Cycle Days: ${analysis.daysInCycle} days

**Key Indicators**:
- EMA15 Breakout: ${analysis.criteria.emaBreakout ? 'Broken' : 'Not Broken'} (Distance ${analysis.metrics.emaDistance}%)
- Unilateral Rise: ${analysis.criteria.singleSidedRise ? 'Yes' : 'No'} (Max Drawdown ${analysis.metrics.maxDrawdown}%)
- Volume Expansion: ${analysis.criteria.volumeExpansion ? 'Yes' : 'No'} (Ratio ${analysis.metrics.volumeRatio})
- Consecutive Days: ${analysis.criteria.consecutiveDays} days above EMA15
- Recent Gains: 7d ${analysis.metrics.gain7d}%, 30d ${analysis.metrics.gain30d}%

**Task**:
Based on the above data, analyze the current market state and provide professional investment advice. Please respond in English, keep it concise and professional (max 4 sentences). Focus on:
1. Confirmation of current stage assessment
2. Data-based risk evaluation
3. Specific operational recommendations` :
      `你是BTC 100天周期理论的专家分析师。

**理论核心**：
- 单边快速上涨通常持续约100天达到峰值
- 四个阶段：观察期(0-30天)、确认期(30-70天)、预警期(70-100天)、休息期
- 基于贝叶斯思维动态评估概率，不机械数日子

**当前市场数据**（已处理完毕，无需计算）：
- BTC价格: $${stats.currentPrice.toLocaleString()}
- 24小时涨跌: ${stats.change24hPercent.toFixed(2)}%

**技术分析结果**：
- 当前阶段: ${stageNames[analysis.stage]}
- 概率评估: ${analysis.probability}%
- 周期天数: ${analysis.daysInCycle}天

**关键指标**：
- EMA15突破: ${analysis.criteria.emaBreakout ? '已突破' : '未突破'} (距离${analysis.metrics.emaDistance}%)
- 单边上涨: ${analysis.criteria.singleSidedRise ? '是' : '否'} (最大回撤${analysis.metrics.maxDrawdown}%)
- 成交量放大: ${analysis.criteria.volumeExpansion ? '是' : '否'} (比率${analysis.metrics.volumeRatio})
- 连续天数: ${analysis.criteria.consecutiveDays}天在EMA15上方
- 近期涨幅: 7天${analysis.metrics.gain7d}%, 30天${analysis.metrics.gain30d}%

**任务**：
基于以上数据分析当前市场状态，给出专业的投资建议。请用中文回答，保持简洁专业（最多4句话）。重点说明：
1. 对当前阶段判断的确认
2. 基于数据的风险评估
3. 具体的操作建议`;

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

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "暂时无法生成分析。";

    return new Response(JSON.stringify({ insight }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ insight: "AI 分析服务暂时不可用。" }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}