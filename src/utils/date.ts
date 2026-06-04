export function postDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${y}-${m}-${day}`;
}

export function postDateHuman(d: string): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [y, m, day] = d.split("-");
  return `${months[+m - 1]} ${+day}, ${y}`;
}
