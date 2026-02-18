export function getDifTextValuationByScoreSpanish(score: number): string {
  if (score >= 0 && score <= 20) return 'Excelente';
  if (score >= 21 && score <= 30) return 'Muy buena';
  if (score >= 30 && score <= 38) return 'Buena';
  if (score >= 39 && score <= 42) return 'Débil';
  if (score >= 43 && score <= 50) return 'Bloqueada';
  if (score >= 51 && score <= 80) return 'Muy bloqueada';
  return 'Severamente bloqueada';
}

export function getDimPercTextValuationByScoreSpanish(score: number): string {
  if (score >= 0 && score <= 10) return 'Excelente';
  if (score >= 11 && score <= 20) return 'Muy buena';
  if (score >= 21 && score <= 38) return 'Buena';
  if (score >= 39 && score <= 42) return 'Débil';
  if (score >= 43 && score <= 50) return 'Bloqueada';
  if (score >= 51 && score <= 70) return 'Muy bloqueada';
  return 'Severamente bloqueada';
}
