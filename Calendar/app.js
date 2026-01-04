// تنظیمات پایه
const state = {
  theme: localStorage.getItem('theme') || 'light',
  pref24h: JSON.parse(localStorage.getItem('pref24h') || 'false'),
  // تاریخ انتخاب‌شده بر اساس میلادی (برای سازگاری Intl)
  selectedDate: new Date(),
  // ماه/سال بر اساس شمسی
  jalaliMonthIndex: null, // 0..11
  jalaliYear: null
};

// نام ماه‌های شمسی
const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// نام روزهای هفته (شنبه تا جمعه)
const weekdays = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];

// ابزار: نمایش اعداد فارسی
const nfFa = new Intl.NumberFormat('fa-IR');

// ابزار: فرمت تاریخ شمسی
const fmtJalaliYMD = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric', month: '2-digit', day: '2-digit'
});
const fmtJalaliWeekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' });

// ابزار: فرمت تاریخ میلادی (اکیداً gregorian)
const fmtGregorianYMD = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', {
  year: 'numeric', month: '2-digit', day: '2-digit'
});

// ابزار: فرمت تاریخ قمری (اسلامی)
const fmtIslamicYMD = new Intl.DateTimeFormat('fa-IR-u-ca-islamic', {
  year: 'numeric', month: '2-digit', day: '2-digit'
});

// ابزار: استخراج اجزای شمسی از Date میلادی با Intl
function getJalaliParts(date) {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10), // 1..12
    day: parseInt(map.day, 10)
  };
}

// ابزار: ساخت Date میلادی از اجزای شمسی با استفاده از تقویم شمسی در Intl (روش تجربی)
function jalaliToGregorianDate(jYear, jMonth, jDay) {
  const today = new Date();
  let probe = new Date(today);
  const targetStr = `${jYear}/${String(jMonth).padStart(2,'0')}/${String(jDay).padStart(2,'0')}`;
  const limit = 20000;
  for (let i = 0; i < limit; i++) {
    const ymd = fmtJalaliYMD.format(probe).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    const normalized = ymd.replace(/[^\d/]/g,'');
    if (normalized === targetStr) return probe;
    probe.setDate(probe.getDate() + (normalized < targetStr ? 1 : -1));
  }
  return today;
}

// آیکون‌های تم
const iconNight = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon">
  <g clip-path="url(#clip0_429_11017)">
    <path d="M20.9955 11.7115L22.2448 11.6721C22.2326 11.2847 22.0414 10.9249 21.7272 10.698C21.413 10.4711 21.0113 10.4029 20.6397 10.5132L20.9955 11.7115ZM12.2885 3.00454L13.4868 3.36028C13.5971 2.98873 13.5289 2.58703 13.302 2.2728C13.0751 1.95857 12.7153 1.76736 12.3279 1.75516L12.2885 3.00454ZM20.6397 10.5132C20.1216 10.667 19.5716 10.75 19 10.75V13.25C19.815 13.25 20.6046 13.1314 21.3512 12.9098L20.6397 10.5132ZM19 10.75C15.8244 10.75 13.25 8.17564 13.25 5H10.75C10.75 9.55635 14.4437 13.25 19 13.25V10.75ZM13.25 5C13.25 4.42841 13.333 3.87841 13.4868 3.36028L11.0902 2.64879C10.8686 3.39542 10.75 4.18496 10.75 5H13.25ZM12 4.25C12.0834 4.25 12.1665 4.25131 12.2492 4.25392L12.3279 1.75516C12.219 1.75173 12.1097 1.75 12 1.75V4.25ZM4.25 12C4.25 7.71979 7.71979 4.25 12 4.25V1.75C6.33908 1.75 1.75 6.33908 1.75 12H4.25ZM12 19.75C7.71979 19.75 4.25 16.2802 4.25 12H1.75C1.75 17.6609 6.33908 22.25 12 22.25V19.75ZM19.75 12C19.75 16.2802 16.2802 19.75 12 19.75V22.25C17.6609 22.25 22.25 17.6609 22.25 12H19.75ZM19.7461 11.7508C19.7487 11.8335 19.75 11.9166 19.75 12H22.25C22.25 11.8903 22.2483 11.781 22.2448 11.6721L19.7461 11.7508Z" fill="#000000"></path>
  </g>
  <defs><clipPath id="clip0_429_11017"><rect width="24" height="24" fill="white"></rect></clipPath></defs>
</svg>
`;
const iconDay = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" class="icon">
  <g clip-path="url(#clip0_429_11039)">
    <circle cx="12" cy="12" r="4" stroke="#000000" stroke-width="2.5" stroke-linejoin="round"></circle>
    <path d="M20 12H21" stroke="#000000" stroke-width="2.5" stroke-linecap="round"></path>
    <path d="M3 12H4" stroke="#000000" stroke-width="2.5" stroke-linecap="round"></path>
    <path d="M12 20L12 21" stroke="#000000" stroke-width="2.5" stroke-linecap="round"></path>
    <path d="M12 3L12 4" stroke="#000000" stroke-width="2.5" stroke-linecap="round"></path>
    <path d="M17.6569 17.6569L18.364 18.364" stroke="#000000" stroke-width="2.5" stroke-linecap="round"></path>
    <path d="M5.63605 5.63604L6.34315 6.34315" stroke="#000000" stroke-width="2.5" stroke-linecap="round"></path>
    <path d="M6.34314 17.6569L5.63603 18.364" stroke="#000000" stroke-width="2.5" stroke-linecap="round"></path>
    <path d="M18.364 5.63604L17.6568 6.34315" stroke="#000000" stroke-width="2.5" stroke-linecap="round"></path>
  </g>
  <defs><clipPath id="clip0_429_11039"><rect width="24" height="24" fill="white"></rect></clipPath></defs>
</svg>
`;

// حالت تاریک/روشن
function applyTheme() {
  const root = document.documentElement;
  if (state.theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');

  // آیکون دکمه تم بر اساس حالت فعلی:
  // اگر حالت فعلی light (روز) است، دکمه باید آیکون شب شدن را نشان دهد.
  // اگر حالت فعلی dark (شب) است، دکمه باید آیکون روز شدن را نشان دهد.
  const iconContainer = document.getElementById('themeIcon');
  iconContainer.innerHTML = state.theme === 'dark' ? iconDay : iconNight;
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', state.theme);
  applyTheme();
}

// مقداردهی اولیه ماه/سال شمسی
function initJalaliMonthYearFromDate(date) {
  const j = getJalaliParts(date);
  state.jalaliMonthIndex = j.month - 1;
  state.jalaliYear = j.year;
}

// پر کردن کنترل‌های ماه/سال (همگام با state)
function populateMonthYearControls() {
  const monthSelect = document.getElementById('monthSelect');
  monthSelect.innerHTML = '';
  jalaliMonths.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });
  monthSelect.value = String(state.jalaliMonthIndex);

  const yearInput = document.getElementById('yearInput');
  yearInput.value = state.jalaliYear;
  yearInput.min = 1200;
  yearInput.max = 1600;
}

// محاسبه تعداد روزهای هر ماه شمسی (ساده‌سازی)
function daysInJalaliMonth(year, monthIndex) {
  if (monthIndex <= 5) return 31;
  if (monthIndex <= 10) return 30;
  const d30 = jalaliToGregorianDate(year, 12, 30);
  const jp = getJalaliParts(d30);
  return (jp.month === 12 && jp.day === 30) ? 30 : 29;
}

// تعیین روز شروع ماه (ستون هفته)
function jalaliMonthStartWeekday(year, monthIndex) {
  const gDate = jalaliToGregorianDate(year, monthIndex + 1, 1);
  const weekdayName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' }).format(gDate);
  const idx = weekdays.indexOf(weekdayName);
  return idx === -1 ? 0 : idx;
}

// ساخت جدول تقویم
function renderCalendar() {
  const tbody = document.getElementById('calendarBody');
  tbody.innerHTML = '';

  const year = state.jalaliYear;
  const monthIndex = state.jalaliMonthIndex;
  const days = daysInJalaliMonth(year, monthIndex);
  const startIdx = jalaliMonthStartWeekday(year, monthIndex);

  // امروز برای علامت‌گذاری
  const todayJ = getJalaliParts(new Date());
  const selectedJ = getJalaliParts(state.selectedDate);

  let day = 1;
  for (let r = 0; r < 6; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < 7; c++) {
      const td = document.createElement('td');
      if (r === 0 && c < startIdx) {
        td.classList.add('empty');
        td.innerHTML = '&nbsp;';
      } else if (day > days) {
        td.classList.add('empty');
        td.innerHTML = '&nbsp;';
      } else {
        const gDate = jalaliToGregorianDate(year, monthIndex + 1, day);
        td.dataset.date = gDate.toISOString();

        const span = document.createElement('span');
        span.className = 'day';
        span.textContent = nfFa.format(day);
        td.appendChild(span);

        const isToday =
          todayJ.year === year && todayJ.month === (monthIndex + 1) && todayJ.day === day;
        if (isToday) td.classList.add('today');

        const isSelected =
          selectedJ.year === year && selectedJ.month === (monthIndex + 1) && selectedJ.day === day;
        if (isSelected) td.classList.add('selected');

        td.addEventListener('click', () => {
          state.selectedDate = gDate;
          initJalaliMonthYearFromDate(state.selectedDate); // همگام‌سازی ماه/سال
          populateMonthYearControls();
          updateSelectedHighlight();
          renderDayDetails();
        });

        day++;
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    if (day > days) break;
  }
}

function updateSelectedHighlight() {
  document.querySelectorAll('.calendar-table td').forEach(td => td.classList.remove('selected'));
  const iso = state.selectedDate.toISOString();
  const target = Array.from(document.querySelectorAll('.calendar-table td'))
    .find(td => td.dataset.date === iso);
  if (target) target.classList.add('selected');
}

// نمایش تاریخ و زمان جاری
function tickTime() {
  const now = new Date();
  document.getElementById('currentDate').textContent = fmtJalaliYMD.format(now);

  let hours = now.getHours();
  let minutes = now.getMinutes();
  let displayHours = hours;
  let suffix = '';
  if (!state.pref24h) {
    suffix = hours >= 12 ? 'بعدازظهر' : 'صبح';
    displayHours = hours % 12 || 12;
  }
  const timeStr = `${nfFa.format(displayHours)}:${nfFa.format(minutes).padStart(2, '۰')}${suffix ? ' ' + suffix : ''}`;
  document.getElementById('currentTime').textContent = timeStr;
}

// نمایش جزئیات روز: هفته، شمسی/قمری/میلادی و مناسبت‌ها
function renderDayDetails() {
  const d = state.selectedDate;

  const jWeekday = fmtJalaliWeekday.format(d);
  const jYMD = fmtJalaliYMD.format(d);
  const gYMD = fmtGregorianYMD.format(d); // تقویم میلادی، با اعداد فارسی
  const iYMD = fmtIslamicYMD.format(d);

  document.getElementById('dayHeadline').textContent = `${jWeekday} — ${jYMD}`;
  document.getElementById('jalaliDate').textContent = jYMD;
  document.getElementById('gregorianDate').textContent = gYMD;
  document.getElementById('islamicDate').textContent = iYMD;

  fetchEventsForDate(d);
}

// مناسبت‌ها: تابع نمونه برای اتصال به API
async function fetchEventsForDate(date) {
  const list = document.getElementById('eventsList');
  list.innerHTML = '';
  const j = getJalaliParts(date);
  const jalaliStr = `${j.year}/${String(j.month).padStart(2,'0')}/${String(j.day).padStart(2,'0')}`;

  try {
    // TODO: اتصال به API واقعی مناسبت‌ها
    const events = sampleEvents(jalaliStr);

    if (!events || events.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'مناسبتی ثبت نشده است.';
      list.appendChild(li);
      return;
    }

    for (const ev of events) {
      const li = document.createElement('li');
      li.textContent = ev.title; // بدون ایموجی
      list.appendChild(li);
    }
  } catch (err) {
    const li = document.createElement('li');
    li.textContent = 'خطا در دریافت مناسبت‌ها.';
    list.appendChild(li);
  }
}

// داده آزمایشی (برای توسعه)
function sampleEvents(jalaliStr) {
  return jalaliStr.endsWith('/01')
    ? [{ title: 'آغاز ماه شمسی' }]
    : [];
}

// رویدادها و مقداردهی
function init() {
  // بارگذاری تم و آیکون
  applyTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // تنظیمات
  const settingsDialog = document.getElementById('settingsDialog');
  document.getElementById('settingsBtn').addEventListener('click', () => settingsDialog.showModal());
  settingsDialog.addEventListener('close', () => {
    // ذخیره تنظیمات
    state.pref24h = document.getElementById('pref24h').checked;
    localStorage.setItem('pref24h', JSON.stringify(state.pref24h));
    renderDayDetails();
    tickTime();
  });
  document.getElementById('pref24h').checked = state.pref24h;

  // تاریخ انتخاب‌شده = امروز
  state.selectedDate = new Date();
  initJalaliMonthYearFromDate(state.selectedDate);

  // کنترل‌های ماه/سال
  populateMonthYearControls();

  // تغییر ماه
  document.getElementById('monthSelect').addEventListener('change', (e) => {
    state.jalaliMonthIndex = parseInt(e.target.value, 10);
    state.selectedDate = jalaliToGregorianDate(state.jalaliYear, state.jalaliMonthIndex + 1, 1);
    populateMonthYearControls();
    renderCalendar();
    renderDayDetails();
  });

  // تغییر سال
  document.getElementById('yearInput').addEventListener('change', (e) => {
    state.jalaliYear = parseInt(e.target.value, 10);
    state.selectedDate = jalaliToGregorianDate(state.jalaliYear, state.jalaliMonthIndex + 1, 1);
    populateMonthYearControls();
    renderCalendar();
    renderDayDetails();
  });

  // ناوبری ماه قبل/بعد
  document.getElementById('prevMonth').addEventListener('click', () => {
    if (state.jalaliMonthIndex === 0) {
      state.jalaliMonthIndex = 11;
      state.jalaliYear--;
    } else {
      state.jalaliMonthIndex--;
    }
    state.selectedDate = jalaliToGregorianDate(state.jalaliYear, state.jalaliMonthIndex + 1, 1);
    populateMonthYearControls();
    renderCalendar();
    renderDayDetails();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    if (state.jalaliMonthIndex === 11) {
      state.jalaliMonthIndex = 0;
      state.jalaliYear++;
    } else {
      state.jalaliMonthIndex++;
    }
    state.selectedDate = jalaliToGregorianDate(state.jalaliYear, state.jalaliMonthIndex + 1, 1);
    populateMonthYearControls();
    renderCalendar();
    renderDayDetails();
  });

  // شروع: زمان و تقویم
  tickTime();
  setInterval(tickTime, 1000);

  renderCalendar();
  renderDayDetails();
}

document.addEventListener('DOMContentLoaded', init);
