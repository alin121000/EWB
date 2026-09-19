import { useEffect, useState } from 'react';
import { Workstreams } from '../lib/resources.js';

export default function WorkstreamSelect({ value, onChange, allowNone = true, label = 'Workstream' }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    Workstreams.list().then(setOptions).catch(() => {});
  }, []);

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        {allowNone && <option value="">General / not sure yet</option>}
        {options.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>
    </div>
  );
}
