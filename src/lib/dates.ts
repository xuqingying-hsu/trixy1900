export function todayKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

export function formatChineseDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}
