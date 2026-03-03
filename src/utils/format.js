const CNY = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2
});

export function formatCNY(value) {
  return CNY.format(Number(value || 0));
}

export function withSign(value) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign} ${formatCNY(Math.abs(value))}`;
}
