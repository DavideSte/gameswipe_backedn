export function yearToUnixTimestamp(year: number) {
  const date = new Date(year, 0, 1);
  return Math.floor(date.getTime() / 1000);
}
