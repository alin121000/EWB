import { Link, useNavigate } from 'react-router-dom';
import { useLiveData } from '../hooks/useLiveData.js';
import { Days } from '../lib/resources.js';

export default function DailyLog() {
  const { data } = useLiveData(() => Days.list(), []);
  const navigate = useNavigate();

  const goToday = async () => {
    const today = await Days.today();
    navigate(`/log/${today.id}`);
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Daily Log</h1>
      </div>

      <button className="btn btn-primary btn-block" style={{ marginBottom: 16 }} onClick={goToday}>
        Open Today's Log
      </button>

      <div className="stack">
        {(data || []).slice().reverse().map((day) => (
          <Link key={day.id} to={`/log/${day.id}`} className="card-link">
            <div className="card">
              <div className="row-between">
                <div className="card-title">Day {day.day_number} – {new Date(day.date).toDateString()}</div>
                {day.closed ? <span className="badge">Closed</span> : <span className="badge badge-gray">Open</span>}
              </div>
              {day.focus && <div className="small muted">{day.focus}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
