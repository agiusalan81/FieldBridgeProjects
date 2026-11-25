/** Cost-plan rollup: variance = forecast − budget, where forecast = max(committed, budget) for open lines
 *  unless committed is set; positive variance means overspend. */
export type EstLine = { section: string; budget: number; committed: number };
export function estimateLine(l: EstLine) {
  const budget = Number(l.budget), committed = Number(l.committed);
  const forecast = committed > 0 ? committed : budget;
  return { budget, committed, forecast, variance: Math.round((forecast - budget) * 100) / 100 };
}
export function estimateTotals(lines: EstLine[], approvedVariations = 0) {
  const t = lines.map(estimateLine).reduce((s, x) => ({ budget: s.budget + x.budget, committed: s.committed + x.committed, forecast: s.forecast + x.forecast, variance: s.variance + x.variance }), { budget: 0, committed: 0, forecast: 0, variance: 0 });
  return { ...t, approvedVariations, forecastFinal: t.forecast + approvedVariations };
}
