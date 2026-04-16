export const normalize = (value, max) => value / max;

export function calculateRisk(j) {
  const risk_score = 
    normalize(j.accident_count, 10) * 0.5 + 
    j.traffic_weight * 0.3 + 
    j.night_factor * 0.2;
  return Math.min(risk_score, 1.0);
}

export function getCause(j) {
  if (j.isLowLight) return "Poor Visibility";
  if (j.isHighway && j.traffic_weight > 0.7) return "Speeding";
  if (j.isJunctionArea) return "Bad Junction Design";
  return "Mixed Factors";
}

export function getFix(cause) {
  if (cause === "Speeding") return "Install IRC-compliant speed cameras";
  if (cause === "Poor Visibility") return "Install IRC-compliant street lighting";
  if (cause === "Bad Junction Design") return "Deploy IRC-compliant junction redesign";
  return "Conduct IRC-compliant safety audit";
}

export function getConfidence(j) {
  const conf = j.accident_count / 10;
  return Math.min(conf, 0.99).toFixed(2);
}
