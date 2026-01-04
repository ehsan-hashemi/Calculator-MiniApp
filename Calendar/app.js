// تنظیمات پایه
const state = {
  theme: localStorage.getItem('theme') || 'light',
  pref24h: JSON.parse(localStorage.getItem('pref24h') || 'false'),
  weekStartFri: JSON.parse(localStorage.getItem('weekStartFri') || 'false'),
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

// ابزار: فرمت تاریخ میلادی
const fmtGregorianYMD = new Intl.DateTimeFormat('fa-IR', {
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

// ابزار: ساخت Date میلادی از اجزای شمسی با استفاده از تقویم شمسی در Intl
function jalaliToGregorianDate(jYear, jMonth, jDay) {
  // Hack: ساخت رشته تاریخ شمسی و پارس به میلادی با Intl (fallback با set to noon)
  // چون Intl مستقیماً Date را نمی‌سازد، از یک راه‌حل تجربی بهره می‌بریم:
  // ابتدا تاریخ امروز را گرفته و اختلاف را با گام‌های روز محاسبه می‌کنیم.
  // برای دقت بهتر، از کتابخانه اختصاصی می‌توان استفاده کرد؛ فعلاً این نسخه ساده است.
  const today = new Date();
  let probe = new Date(today);
  // حرکت تا رسیدن به سال و ماه و روز مورد نظر (حداکثر چند هزار گام در بدترین حالت)
  // برای کار واقعی بهتر است از الگوریتم دقیق جلالی استفاده شود.
  const targetStr = `${jYear}/${String(jMonth).padStart(2,'0')}/${String(jDay).padStart(2,'0')}`;
  // جست‌وجوی دوجهته با محدودیت
  const limit = 20000;
  for (let i = 0; i < limit; i++) {
    const ymd = fmtJalaliYMD.format(probe).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    // تبدیل اعداد فارسی به انگلیسی
    const normalized = ymd.replace(/[^\d/]/g,'');
    if (normalized === targetStr) return probe;
    // حرکت ±
    probe.setDate(probe.getDate() + (normalized < targetStr ? 1 : -1));
  }
  // اگر پیدا نشد، برگرداندن امروز
  return today;
}

// حالت تاریک/روشن
function applyTheme() {
  const root = document.documentElement;
  if (state.theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
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

// پر کردن کنترل‌های ماه/سال
function populateMonthYearControls() {
  const monthSelect = document.getElementById('monthSelect');
  monthSelect.innerHTML = '';
  jalaliMonths.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = m;
    if (i === state.jalaliMonthIndex) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  const yearInput = document.getElementById('yearInput');
  yearInput.value = state.jalaliYear;
  yearInput.min = 1200;
  yearInput.max = 1600;
}

// محاسبه تعداد روزهای هر ماه شمسی (ساده‌سازی)
function daysInJalaliMonth(year, monthIndex) {
  // 0..5 => 31 روز، 6..10 => 30 روز، 11 => 29 یا 30 بسته به کبیسه
  if (monthIndex <= 5) return 31;
  if (monthIndex <= 10) return 30;
  // اسفند: تخمینی؛ برای دقت کامل نیاز به الگوریتم کبیسه جلالی است.
  // از Intl برای بررسی وجود 30 اسفند استفاده می‌کنیم:
  const d30 = jalaliToGregorianDate(year, 12, 30);
  const jp = getJalaliParts(d30);
  return (jp.month === 12 && jp.day === 30) ? 30 : 29;
}

// تعیین روز شروع ماه (ستون هفته)
function jalaliMonthStartWeekday(year, monthIndex) {
  const gDate = jalaliToGregorianDate(year, monthIndex + 1, 1);
  const weekdayName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' }).format(gDate);
  // نگاشت به ایندکس 0..6 با ترتیب شنبه..جمعه
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
  let startIdx = jalaliMonthStartWeekday(year, monthIndex);

  // تنظیم شروع هفته اگر کاربر خواست جمعه اول باشد
  let headers = [...weekdays];
  if (state.weekStartFri) {
    const shift = headers.pop(); // جمعه
    headers.unshift(shift);
    // تبدیل ایندکس شروع نسبت به جمعه‌محور
    startIdx = (startIdx + 1) % 7;
    // نکته: برای سادگی، تیتر جدول از HTML ثابت می‌آید؛ می‌توانید تیتربندی داینامیک کنید.
  }

  // امروز برای علامت‌گذاری
  const todayJ = getJalaliParts(new Date());
  const selectedJ = getJalaliParts(state.selectedDate);

  // 6 ردیف * 7 ستون (حداکثر نیاز)
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
  // تاریخ شمسی: ۱۴۰۴/۱۰/۱۴
  document.getElementById('currentDate').textContent = fmtJalaliYMD.format(now);

  // زمان: ۲:۱۸ (بزرگ‌تر از تاریخ)
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

  const jWeekday = fmtJalaliWeekday.format(d); // «شنبه»، ...
  const jYMD = fmtJalaliYMD.format(d);         // ۱۴۰۴/۱۰/۱۴
  const gYMD = fmtGregorianYMD.format(d);      // 2026/01/04 به فارسی‌دیجیت
  const iYMD = fmtIslamicYMD.format(d);        // 1447/06/23 (تقریبی بسته به تقویم)

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
  // رشته تاریخ شمسی برای API
  const j = getJalaliParts(date);
  const jalaliStr = `${j.year}/${String(j.month).padStart(2,'0')}/${String(j.day).padStart(2,'0')}`;

  try {
    // جایگزین کنید با API واقعی:
    // const resp = await fetch(`https://example.com/api/events?jalali=${encodeURIComponent(jalaliStr)}`);
    // const events = await resp.json();

    // موقت: داده آزمایشی
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
  // نمونه ساده؛ در اتصال واقعی، از پاسخ API استفاده کنید.
  return jalaliStr.endsWith('/01')
    ? [{ title: 'آغاز ماه شمسی' }]
    : [];
}

// رویدادها و مقداردهی
function init() {
  // تم
  applyTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // تنظیمات
  const settingsDialog = document.getElementById('settingsDialog');
  document.getElementById('settingsBtn').addEventListener('click', () => settingsDialog.showModal());
  settingsDialog.addEventListener('close', () => {
    // ذخیره تنظیمات
    state.pref24h = document.getElementById('pref24h').checked;
    state.weekStartFri = document.getElementById('prefWeekStartFri').checked;
    localStorage.setItem('pref24h', JSON.stringify(state.pref24h));
    localStorage.setItem('weekStartFri', JSON.stringify(state.weekStartFri));
    renderCalendar();
    renderDayDetails();
  });
  // مقدار اولیه سوییچ‌ها
  document.getElementById('pref24h').checked = state.pref24h;
  document.getElementById('prefWeekStartFri').checked = state.weekStartFri;

  // تاریخ انتخاب‌شده = امروز
  state.selectedDate = new Date();
  initJalaliMonthYearFromDate(state.selectedDate);

  // کنترل‌های ماه/سال
  populateMonthYearControls();

  // تغییر ماه
  document.getElementById('monthSelect').addEventListener('change', (e) => {
    state.jalaliMonthIndex = parseInt(e.target.value, 10);
    // هم‌تراز کردن selectedDate با ۱ ماه جدید
    state.selectedDate = jalaliToGregorianDate(state.jalaliYear, state.jalaliMonthIndex + 1, 1);
    renderCalendar();
    renderDayDetails();
  });

  // تغییر سال
  document.getElementById('yearInput').addEventListener('change', (e) => {
    state.jalaliYear = parseInt(e.target.value, 10);
    state.selectedDate = jalaliToGregorianDate(state.jalaliYear, state.jalaliMonthIndex + 1, 1);
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
