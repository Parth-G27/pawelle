import { Link } from 'react-router-dom'
import { answerPills } from '../lib/checkin.js'
import { formatDay } from '../lib/dates.js'
import HeadsUp from './HeadsUp.jsx'

export default function CheckInRow({ item, today }) {
  const pills = answerPills(item)
  const isToday = item.date === today
  return (
    <li className="rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold">{formatDay(item.date, today)}</h3>
        {isToday && (
          <Link
            to="/today"
            state={{ edit: true }}
            className="inline-flex min-h-11 items-center px-2 font-bold text-primary underline underline-offset-4"
          >
            Change
          </Link>
        )}
      </div>
      {pills.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-2">
          {pills.map((p) => (
            <li key={p.key} className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-sm font-semibold">
              <span aria-hidden="true">{p.icon}</span>
              {p.text}
            </li>
          ))}
        </ul>
      )}
      {item.note && <p className="mt-2 whitespace-pre-wrap text-muted">{item.note}</p>}
      {item.flags?.length > 0 && (
        <div className="mt-3">
          <HeadsUp flags={item.flags} />
        </div>
      )}
    </li>
  )
}
