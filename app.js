// Simple scheduling UI: week view, add/edit/delete events saved to localStorage
const weekView = document.getElementById('weekView');
const dayView = document.getElementById('dayView');
const weekCalendar = document.getElementById('weekCalendar');
const dayCalendar = document.getElementById('dayCalendar');
const dayAgenda = document.getElementById('dayAgenda');
const dateLabel = document.getElementById('dateLabel');
const addEventBtn = document.getElementById('addEventBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const todayBtn = document.getElementById('todayBtn');
const viewToggle = document.getElementById('viewToggle');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const eventForm = document.getElementById('eventForm');
const titleInput = document.getElementById('title');
const dateInput = document.getElementById('date');
const startInput = document.getElementById('start');
const endInput = document.getElementById('end');
const cancelBtn = document.getElementById('cancelBtn');
const deleteBtn = document.getElementById('deleteBtn');

let editingId = null;
let currentDate = new Date();
let currentView = 'week'; // 'week' or 'day'

function loadEvents(){
  try{ return JSON.parse(localStorage.getItem('scheduleEvents')||'[]'); }
  catch(e){return []}
}
function saveEvents(events){ localStorage.setItem('scheduleEvents', JSON.stringify(events)); }

function startOfWeek(d){ const dd=new Date(d); const day=dd.getDay(); const diff = dd.getDate() - day + (day===0?-6:1); // Monday start
  dd.setDate(diff); dd.setHours(0,0,0,0); return dd; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function isSameDay(d1, d2){ return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(); }

function formatDate(d){ return d.toISOString().slice(0,10); }
function timeToMinutes(t){ const [h,m]=t.split(':').map(Number); return h*60 + m; }

function updateDateLabel() {
  if (currentView === 'week') {
    const start = startOfWeek(currentDate);
    const end = addDays(start, 6);
    dateLabel.textContent = `Tuần: ${start.toLocaleDateString()} — ${end.toLocaleDateString()}`;
  } else {
    dateLabel.textContent = currentDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}

function renderTimeGrid(container, isWeekView) {
  container.innerHTML = '';
  const hours = [];
  for(let h=6; h<=22; h++) hours.push((h<10? '0'+h : h) + ':00');

  // left column with hours
  const leftCol = document.createElement('div');
  leftCol.className = 'hour-col';
  leftCol.appendChild(document.createElement('div'));
  hours.forEach(h=>{ 
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = h;
    leftCol.appendChild(slot);
  });
  container.appendChild(leftCol);
}

function renderWeek(){
  const start = startOfWeek(currentDate);
  renderTimeGrid(weekCalendar, true);

  // days
  const events = loadEvents();
  for(let d=0; d<7; d++){
    const dayDate = addDays(start, d);
    const col = document.createElement('div');
    col.className = 'day-col';
    
    const header = document.createElement('div');
    header.className = 'day-header';
    header.textContent = dayDate.toLocaleDateString('vi-VN', {weekday:'short', day:'2-digit', month:'2-digit'});
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      currentDate = dayDate;
      switchView('day');
    });
    col.appendChild(header);

    // slots container
    const slots = document.createElement('div');
    slots.style.position = 'relative';
    for(let h=6; h<=22; h++){
      const s = document.createElement('div');
      s.className = 'slot';
      slots.appendChild(s);
    }
    col.appendChild(slots);

    // attach click to create quick event by clicking a slot
    slots.addEventListener('dblclick', (e)=>{
      const rect = slots.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const slotHeight = rect.height / (22-6);
      const hour = Math.floor(y / slotHeight) + 6;
      const selectedDate = formatDate(dayDate);
      const timeStr = (hour < 10 ? '0'+hour : hour) + ':00';
      openModalForNew(selectedDate, timeStr);
    });

    // render events
    renderDayEvents(slots, events, dayDate);
    weekCalendar.appendChild(col);
  }
}

function renderDay() {
  renderTimeGrid(dayCalendar, false);
  
  // main day column
  const col = document.createElement('div');
  col.className = 'day-col';
  
  // slots container
  const slots = document.createElement('div');
  slots.style.position = 'relative';
  for(let h=6; h<=22; h++){
    const s = document.createElement('div');
    s.className = 'slot';
    slots.appendChild(s);
  }
  col.appendChild(slots);

  // attach click to create quick event
  slots.addEventListener('dblclick', (e)=>{
    const rect = slots.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const slotHeight = rect.height / (22-6);
    const hour = Math.floor(y / slotHeight) + 6;
    const selectedDate = formatDate(currentDate);
    const timeStr = (hour < 10 ? '0'+hour : hour) + ':00';
    openModalForNew(selectedDate, timeStr);
  });

  // render events
  const events = loadEvents();
  renderDayEvents(slots, events, currentDate);
  dayCalendar.appendChild(col);

  // render agenda
  renderDayAgenda(events);
}

function renderDayEvents(container, events, date) {
  const dayEvents = events
    .filter(ev => isSameDay(new Date(ev.date), date))
    .sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  dayEvents.forEach(ev => {
    const evEl = document.createElement('div');
    evEl.className = 'event';
    evEl.textContent = ev.title + ' (' + ev.start + '-' + ev.end + ')';
    
    // compute position
    const startMin = timeToMinutes(ev.start);
    const endMin = timeToMinutes(ev.end);
    const dayStart = 6*60;
    const dayEnd = 22*60;
    const total = dayEnd - dayStart;
    
    const topPercent = ((startMin - dayStart)/total)*100;
    const heightPercent = ((endMin - startMin)/total)*100;
    
    evEl.style.top = `calc(${topPercent}% + 28px)`; // account for header
    evEl.style.height = `calc(${heightPercent}% - 8px)`;
    if(heightPercent < 6) evEl.classList.add('small');
    
    evEl.addEventListener('click', (e) => {
      e.stopPropagation();
      openModalForEdit(ev.id);
    });
    
    container.appendChild(evEl);
  });
}

function renderDayAgenda(events) {
  const dayEvents = events
    .filter(ev => isSameDay(new Date(ev.date), currentDate))
    .sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  dayAgenda.innerHTML = '';
  if (dayEvents.length === 0) {
    dayAgenda.innerHTML = '<p class="muted">Không có sự kiện nào</p>';
    return;
  }

  const list = document.createElement('div');
  list.className = 'agenda-list';
  
  dayEvents.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'agenda-item';
    item.innerHTML = `
      <div class="agenda-time">${ev.start} - ${ev.end}</div>
      <div class="agenda-title">${ev.title}</div>
    `;
    item.addEventListener('click', () => openModalForEdit(ev.id));
    list.appendChild(item);
  });
  
  dayAgenda.appendChild(list);
}

function switchView(view) {
  currentView = view;
  weekView.classList.toggle('hidden', view !== 'week');
  dayView.classList.toggle('hidden', view !== 'day');
  viewToggle.textContent = view === 'week' ? 'Tuần' : 'Ngày';
  updateDateLabel();
  render();
}

function render() {
  if (currentView === 'week') {
    renderWeek();
  } else {
    renderDay();
  }
}

function navigate(direction) {
  if (currentView === 'week') {
    currentDate = addDays(currentDate, direction * 7);
  } else {
    currentDate = addDays(currentDate, direction);
  }
  updateDateLabel();
  render();
}

// Event Listeners
viewToggle.addEventListener('click', () => {
  switchView(currentView === 'week' ? 'day' : 'week');
});

prevBtn.addEventListener('click', () => navigate(-1));
nextBtn.addEventListener('click', () => navigate(1));
todayBtn.addEventListener('click', () => {
  currentDate = new Date();
  updateDateLabel();
  render();
});

function openModal(){ modal.classList.remove('hidden'); }
function closeModal(){ modal.classList.add('hidden'); resetForm(); editingId=null; }
function resetForm(){ eventForm.reset(); deleteBtn.classList.add('hidden'); modalTitle.textContent='Thêm sự kiện'; }

function openModalForNew(dateStr, startHint){ resetForm(); editingId=null; modalTitle.textContent='Thêm sự kiện'; dateInput.value = dateStr || formatDate(new Date()); startInput.value = startHint ? startHint : '09:00'; endInput.value = '10:00'; deleteBtn.classList.add('hidden'); openModal(); }
function openModalForEdit(id){ const events = loadEvents(); const ev = events.find(x=>x.id===id); if(!ev) return; editingId=id; modalTitle.textContent='Chỉnh sửa sự kiện'; titleInput.value=ev.title; dateInput.value=ev.date; startInput.value=ev.start; endInput.value=ev.end; deleteBtn.classList.remove('hidden'); openModal(); }

addEventBtn.addEventListener('click', ()=> openModalForNew(formatDate(new Date())));

cancelBtn.addEventListener('click', closeModal);

eventForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const title = titleInput.value.trim(); const date = dateInput.value; const start = startInput.value; const end = endInput.value;
  if(!title || !date || !start || !end){ alert('Vui lòng điền đủ thông tin'); return; }
  if(timeToMinutes(end) <= timeToMinutes(start)){ alert('Thời gian kết thúc phải lớn hơn bắt đầu'); return; }

  const events = loadEvents();
  if(editingId){
    const idx = events.findIndex(x=>x.id===editingId);
    if(idx>=0){ events[idx] = {...events[idx], title,date,start,end}; saveEvents(events); }
  } else {
    const newEv = { id: 'ev_'+Date.now(), title, date, start, end };
    events.push(newEv); saveEvents(events);
  }
  closeModal(); render();
});

deleteBtn.addEventListener('click', ()=>{
  if(!editingId) return; 
  if(!confirm('Xác nhận xóa sự kiện?')) return; 
  const events = loadEvents().filter(x=>x.id!==editingId); 
  saveEvents(events); 
  closeModal(); 
  render();
});

// close modal when clicking outside content
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

// Theme handling
const themeToggle = document.getElementById('themeToggle');
function getPreferredTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Set initial theme
setTheme(getPreferredTheme());

// Watch for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!localStorage.getItem('theme')) { // Only auto-switch if user hasn't manually chosen
    setTheme(e.matches ? 'dark' : 'light');
  }
});

// initial render
renderWeek();

// expose for debugging
window._schedule = { loadEvents, saveEvents, render }
