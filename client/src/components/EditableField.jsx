import { useEffect, useState } from 'react';

export default function EditableField({ value, placeholder, onSave, busy, multiline }) {
  const [draft, setDraft] = useState(value || '');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value || '');
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const Field = multiline ? 'textarea' : 'input';

  return (
    <Field
      className={multiline ? 'textarea-quiet' : 'input'}
      style={multiline ? {} : { border: 'none', padding: 0, background: 'transparent', minHeight: 'auto' }}
      value={draft}
      placeholder={placeholder}
      onFocus={() => setEditing(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      disabled={busy}
    />
  );
}
