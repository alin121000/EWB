import { useEffect, useState } from 'react';
import { Exporter } from '../lib/resources.js';
import { markdownToHtml } from '../lib/markdown.js';

export default function ExportPage() {
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [markdown, setMarkdown] = useState('');
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    Exporter.sections().then((rows) => {
      setSections(rows);
      setSelected(new Set(rows.map((r) => r.key)));
    });
  }, []);

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const build = async () => {
    setBuilding(true);
    const { data } = await Exporter.build([...selected]);
    setMarkdown(data.markdown);
    setBuilding(false);
  };

  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delegation-review.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Delegation Review</title><style>
      body{font-family:-apple-system,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#1c1c1a;line-height:1.5}
      h1{font-size:26px} h2{font-size:20px;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:28px}
      h3{font-size:16px;margin-top:18px} li{margin-bottom:4px}
    </style></head><body>${markdownToHtml(markdown)}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <h1>Export Delegation</h1>
        <div className="sub">Choose sections, then build a clean document to share.</div>
      </div>

      <div className="card">
        {sections.map((s) => (
          <label key={s.key} className="row" style={{ padding: '8px 0' }}>
            <input type="checkbox" checked={selected.has(s.key)} onChange={() => toggle(s.key)} style={{ width: 20, height: 20 }} />
            <span>{s.label}</span>
          </label>
        ))}
      </div>

      <button className="btn btn-primary btn-block" onClick={build} disabled={building || selected.size === 0}>
        {building ? 'Building…' : 'Build Export'}
      </button>

      {markdown && (
        <>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" style={{ flex: 1 }} onClick={download}>Download .md</button>
            <button className="btn" style={{ flex: 1 }} onClick={print}>Print / Save PDF</button>
          </div>
          <div className="section-heading">Preview</div>
          <div className="card" dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }} />
        </>
      )}
    </div>
  );
}
