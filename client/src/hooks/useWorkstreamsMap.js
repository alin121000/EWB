import { useEffect, useState } from 'react';
import { Workstreams } from '../lib/resources.js';

export function useWorkstreamsMap() {
  const [map, setMap] = useState({});
  const [list, setList] = useState([]);

  useEffect(() => {
    Workstreams.list()
      .then((rows) => {
        setList(rows);
        setMap(Object.fromEntries(rows.map((w) => [w.id, w.name])));
      })
      .catch(() => {});
  }, []);

  return { map, list, nameFor: (id) => (id ? map[id] || 'Unassigned' : 'General') };
}
