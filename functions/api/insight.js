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

    const { analysis, stats } = await request.json();

    const stageNames = {
      observation: '观察期 (0-30天)',
      confirmation: '确认期 (30-70天)',
      warning: '预警期 (70-100天)',
      rest: '休息期'
    };

    const prompt = `你是BTC 100天周期理论的专家分析师。

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