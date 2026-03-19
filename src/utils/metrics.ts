export const toPercentValue = (value: number | null | undefined): number | null => {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }

  const numeric = Number(value);
  const normalized = numeric <= 1 ? numeric * 100 : numeric;
  return Math.max(0, Math.min(100, normalized));
};

export const toPercentLabel = (value: number | null | undefined): string => {
  const percent = toPercentValue(value);
  if (percent == null) {
    return "-";
  }
  return `${Math.round(percent)}%`;
};