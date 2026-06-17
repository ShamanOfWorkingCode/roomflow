import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import {
  getCalendar, addVacationDays, removeVacationDay, getEmployees,
  getBookings, cancelBooking, getTasks, createTask, deleteTask,
} from '../api/client'
import { useAuth } from '../context/AuthContext'
import './CalendarPage.css'

dayjs.locale('ru')

// Типы отсутствий (calendar/vacations)
const VAC_LABELS = {
  vacation: 'Отпуск',
  sick: 'Больничный',
  remote: 'Удалёнка',
  dayoff: 'Выходной (доп.)',
}
const VAC_COLORS = {
  vacation: '#2563eb',
  sick: '#dc2626',
  remote: '#16a34a',
  dayoff: '#d97706',
}
// Бронь комнаты и личная задача — отдельные визуальные типы в том же календаре
const BOOKING_COLOR = '#7c3aed'
const BOOKING_LABEL = 'Бронь комнаты'
const TASK_COLOR = '#0891b2'
const TASK_LABEL = 'Личная задача'

export default function CalendarPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(dayjs())
  const [vacations, setVacations] = useState([])
  const [bookings, setBookings] = useState([])
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Выбор дней для добавления отметки отсутствия
  const [selecting, setSelecting] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const [targetEmployeeId, setTargetEmployeeId] = useState(user?.id)
  const [vacType, setVacType] = useState('vacation')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Форма добавления личной задачи
  const [addingTask, setAddingTask] = useState(false)
  const [taskForm, setTaskForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    hour: 10,
    duration_hours: 1,
    title: '',
  })
  const [savingTask, setSavingTask] = useState(false)

  const monthStart = month.startOf('month')
  const monthEnd = month.endOf('month')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [vacs, emps, myBookings, allTasks] = await Promise.all([
        getCalendar(monthStart.format('YYYY-MM-DD'), monthEnd.format('YYYY-MM-DD')),
        getEmployees(),
        getBookings({
          employee_id: user.id,
          date_from: monthStart.format('YYYY-MM-DD'),
          date_to: monthEnd.format('YYYY-MM-DD'),
        }),
        getTasks({
          date_from: monthStart.format('YYYY-MM-DD'),
          date_to: monthEnd.format('YYYY-MM-DD'),
        }),
      ])
      setVacations(vacs)
      setEmployees(emps)
      setBookings(myBookings)
      setTasks(allTasks)
    } catch {
      setError('Не удалось загрузить календарь')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [month])

  // Объединяем отпуска, брони и личные задачи в единый список записей по дате.
  const byDate = useMemo(() => {
    const map = {}
    vacations.forEach(v => {
      if (!map[v.date]) map[v.date] = []
      map[v.date].push({
        kind: 'vacation',
        id: `v-${v.id}`,
        date: v.date,
        employee_id: v.employee_id,
        label: v.employee_name.split(' ')[0],
        color: VAC_COLORS[v.type],
        title: `${v.employee_name} — ${VAC_LABELS[v.type]}${v.note ? ': ' + v.note : ''}`,
        sortHour: -1,
        raw: v,
      })
    })
    bookings.forEach(b => {
      if (!map[b.booking_date]) map[b.booking_date] = []
      map[b.booking_date].push({
        kind: 'booking',
        id: `b-${b.id}`,
        date: b.booking_date,
        employee_id: b.employee_id,
        label: `${b.hour}:00 ${b.room_name}`,
        color: BOOKING_COLOR,
        title: `${BOOKING_LABEL}: ${b.room_name} в ${b.hour}:00`,
        sortHour: b.hour,
        raw: b,
      })
    })
    tasks.forEach(t => {
      if (!map[t.date]) map[t.date] = []
      const endHour = t.hour + t.duration_hours
      map[t.date].push({
        kind: 'task',
        id: `t-${t.id}`,
        date: t.date,
        employee_id: t.employee_id,
        label: `${t.hour}:00 ${t.title}`,
        color: TASK_COLOR,
        title: `${TASK_LABEL} (${t.employee_name}): ${t.title}, ${t.hour}:00–${endHour}:00`,
        sortHour: t.hour,
        raw: t,
      })
    })
    // Сортируем записи внутри дня: отпуска сверху, дальше брони/задачи по времени
    Object.values(map).forEach(list => list.sort((a, b) => a.sortHour - b.sortHour))
    return map
  }, [vacations, bookings, tasks])

  const daysInGrid = useMemo(() => {
    const firstWeekday = (monthStart.day() + 6) % 7 // понедельник = 0
    const days = []
    for (let i = 0; i < firstWeekday; i++) days.push(null)
    for (let d = 1; d <= monthEnd.date(); d++) {
      days.push(monthStart.date(d))
    }
    return days
  }, [month])

  function toggleDateSelection(dateStr) {
    if (!selecting) return
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    )
  }

  function startSelecting() {
    setAddingTask(false)
    setSelecting(true)
    setSelectedDates([])
    setTargetEmployeeId(user?.id)
    setVacType('vacation')
    setNote('')
  }

  function cancelSelecting() {
    setSelecting(false)
    setSelectedDates([])
  }

  function startAddingTask() {
    setSelecting(false)
    setAddingTask(true)
    setTaskForm({ date: dayjs().format('YYYY-MM-DD'), hour: 10, duration_hours: 1, title: '' })
  }

  function cancelAddingTask() {
    setAddingTask(false)
  }

  async function handleSave() {
    if (selectedDates.length === 0) return
    setSaving(true)
    setError('')
    try {
      await addVacationDays({
        employee_id: targetEmployeeId,
        dates: selectedDates,
        type: vacType,
        note,
      })
      cancelSelecting()
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTask() {
    if (!taskForm.title.trim()) {
      setError('Укажите название задачи')
      return
    }
    setSavingTask(true)
    setError('')
    try {
      await createTask({
        employee_id: user.id,
        date: taskForm.date,
        hour: Number(taskForm.hour),
        duration_hours: Number(taskForm.duration_hours),
        title: taskForm.title.trim(),
      })
      cancelAddingTask()
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении задачи')
    } finally {
      setSavingTask(false)
    }
  }

  async function handleEntryClick(entry) {
    if (selecting) return
    if (entry.kind === 'vacation') {
      if (!confirm('Убрать эту отметку отсутствия?')) return
      try {
        await removeVacationDay(entry.employee_id, entry.date, user.id, user.is_manager)
        load()
      } catch (err) {
        setError(err.response?.data?.detail || 'Ошибка при удалении')
      }
    } else if (entry.kind === 'booking') {
      if (entry.employee_id !== user.id) return // чужую бронь не трогаем здесь
      if (!confirm(`Отменить бронь «${entry.raw.room_name}» в ${entry.raw.hour}:00?`)) return
      try {
        await cancelBooking(entry.raw.id, user.id)
        load()
      } catch (err) {
        setError(err.response?.data?.detail || 'Ошибка при отмене брони')
      }
    } else if (entry.kind === 'task') {
      if (entry.employee_id !== user.id) return // чужую задачу не трогаем
      if (!confirm(`Удалить задачу «${entry.raw.title}»?`)) return
      try {
        await deleteTask(entry.raw.id, user.id)
        load()
      } catch (err) {
        setError(err.response?.data?.detail || 'Ошибка при удалении задачи')
      }
    }
  }

  const todayStr = dayjs().format('YYYY-MM-DD')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Календарь</div>
        {!selecting && !addingTask ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={startAddingTask}>+ Добавить задачу</button>
            <button className="btn primary" onClick={startSelecting}>+ Отметить отсутствие</button>
          </div>
        ) : selecting ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={cancelSelecting}>Отмена</button>
            <button className="btn primary" onClick={handleSave} disabled={saving || selectedDates.length === 0}>
              {saving ? 'Сохраняем...' : `Сохранить (${selectedDates.length})`}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={cancelAddingTask}>Отмена</button>
            <button className="btn primary" onClick={handleSaveTask} disabled={savingTask}>
              {savingTask ? 'Сохраняем...' : 'Сохранить задачу'}
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {addingTask && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
              <label>Дата</label>
              <input
                type="date"
                value={taskForm.date}
                onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 100 }}>
              <label>Время начала</label>
              <select value={taskForm.hour} onChange={e => setTaskForm(f => ({ ...f, hour: e.target.value }))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 130 }}>
              <label>Длительность</label>
              <select value={taskForm.duration_hours} onChange={e => setTaskForm(f => ({ ...f, duration_hours: e.target.value }))}>
                {[1, 2, 3, 4, 6, 8].map(h => (
                  <option key={h} value={h}>{h} {h === 1 ? 'час' : 'часа'}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
              <label>Что за задача</label>
              <input
                value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Например: занят на внешней встрече"
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>
            Задача появится в общем календаре — коллеги увидят, что вы заняты в это время.
          </div>
        </div>
      )}

      {selecting && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
              <label>Кому отмечаем</label>
              <select
                value={targetEmployeeId}
                onChange={e => setTargetEmployeeId(Number(e.target.value))}
                disabled={!user?.is_manager}
              >
                {user?.is_manager
                  ? employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.department})</option>
                    ))
                  : <option value={user?.id}>{user?.full_name} (вы)</option>
                }
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
              <label>Тип</label>
              <select value={vacType} onChange={e => setVacType(e.target.value)}>
                <option value="vacation">Отпуск</option>
                <option value="sick">Больничный</option>
                <option value="remote">Удалёнка</option>
                <option value="dayoff">Доп. выходной</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
              <label>Заметка (необязательно)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Причина, комментарий..." />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>
            Кликните на дни в календаре ниже, чтобы выбрать их.
          </div>
        </div>
      )}

      {!user?.is_manager && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
          Вы можете отмечать и снимать отметки отсутствия только себе. Изменение чужих отметок доступно офис-менеджерам.
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button className="btn" onClick={() => setMonth(m => m.subtract(1, 'month'))}>←</button>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{month.format('MMMM YYYY')}</div>
          <button className="btn" onClick={() => setMonth(m => m.add(1, 'month'))}>→</button>
        </div>

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <>
            <div className="cal-weekdays">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                <div key={d} className="cal-weekday">{d}</div>
              ))}
            </div>
            <div className="cal-grid">
              {daysInGrid.map((day, i) => {
                if (!day) return <div key={i} className="cal-cell empty" />
                const dateStr = day.format('YYYY-MM-DD')
                const entries = byDate[dateStr] || []
                const isToday = dateStr === todayStr
                const isSelected = selectedDates.includes(dateStr)
                return (
                  <div
                    key={dateStr}
                    className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${selecting ? 'selectable' : ''}`}
                    onClick={() => toggleDateSelection(dateStr)}
                  >
                    <div className="cal-date">{day.date()}</div>
                    <div className="cal-entries">
                      {entries.slice(0, 3).map(e => (
                        <div
                          key={e.id}
                          className="cal-entry"
                          style={{ background: e.color + '1A', color: e.color }}
                          title={e.title}
                          onClick={(ev) => { ev.stopPropagation(); handleEntryClick(e) }}
                        >
                          {e.kind === 'booking' ? '🕘 ' : e.kind === 'task' ? '📌 ' : ''}{e.label}
                        </div>
                      ))}
                      {entries.length > 3 && (
                        <div className="cal-entry-more">+{entries.length - 3}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
        {Object.entries(VAC_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: VAC_COLORS[key], display: 'inline-block' }} />
            {label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: BOOKING_COLOR, display: 'inline-block' }} />
          {BOOKING_LABEL}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: TASK_COLOR, display: 'inline-block' }} />
          {TASK_LABEL}
        </div>
      </div>
    </div>
  )
}
