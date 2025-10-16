import dayjs from 'dayjs'; // for date manipulation

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// YYYY-MM-DD -> { day: 1~31, price, soldOut }
export function makeCalendarData({ calendar_detail, b2c_price }) {
  // calendar_detail = { '2025-10-18': { b2c_price: { fullday: 1234 }, ... }, ... }
  if (!calendar_detail) return {};
  const result = {};
  for (const date of Object.keys(calendar_detail)) {
    const info = calendar_detail[date];
    const price = info?.b2c_price?.fullday ?? b2c_price ?? 0;
    const remain = typeof info?.remain_qty === "number" ? info.remain_qty : undefined;
    result[date] = {
      price,
      soldOut: remain !== undefined ? remain <= 0 : false,
    };
  }
  return result;
}

export function getMonthMatrix(year, month, calendarData, sale_s_date, sale_e_date) {
  // month: 1~12
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const startOfWeek = firstDay.day(); // 요일(0:일~6:토)
  const daysInMonth = firstDay.daysInMonth();

  // 기간 제한
  const minDay = sale_s_date ? dayjs(sale_s_date) : null;
  const maxDay = sale_e_date ? dayjs(sale_e_date) : null;

  const matrix = [];
  let week = [];
  let dayNum = 1;

  // 첫 주 빈칸
  for (let i = 0; i < startOfWeek; ++i) {
    week.push(null);
  }

  while (dayNum <= daysInMonth) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    let cell = null;
    if (
      (!minDay || !dayjs(dateStr).isBefore(minDay)) &&
      (!maxDay || !dayjs(dateStr).isAfter(maxDay))
    ) {
      cell = {
        date: dateStr,
        day: dayNum,
        ...calendarData[dateStr],
      };
    }
    week.push(cell);
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
    dayNum++;
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

export function formatPrice(price) {
  if (price >= 10000) return `${Math.round(price / 10000)}만`;
  if (price >= 1000) return `${Math.round(price / 1000)}천`;
  return price.toLocaleString();
}