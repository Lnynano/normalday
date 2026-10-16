import { useState } from 'react';
import { z } from 'zod';
import { Button, Card, Switch } from '../../components/ui';
import { DETAIL_PRESETS } from '../../data/details';
import { useLang } from '../../i18n/lang';
import { S } from '../../i18n/strings';
import { copyText } from '../../lib/clipboard';
import { newId } from '../../lib/id';
import { usePersistentState } from '../../lib/usePersistentState';
import { detailEntry, formatDetails, MAX_ENTRIES, maskValue, parseBackup, serializeBackup, type DetailEntry } from './logic';

const L = {
  mine: { th: 'ข้อมูลของฉัน', en: 'My details' },
  tapToCopy: { th: 'แตะรายการเพื่อคัดลอก', en: 'Tap an item to copy it' },
  empty: { th: 'ยังไม่มีข้อมูล — เลือกหัวข้อด้านล่างเพื่อเพิ่ม', en: 'Nothing yet — pick a heading below to add one' },
  unnamed: { th: '(ไม่มีชื่อ)', en: '(no label)' },
  noValue: { th: 'แตะเพื่อใส่ข้อมูล', en: 'Tap to fill in' },
  copyAll: { th: 'คัดลอกทั้งหมด', en: 'Copy all' },
  show: { th: 'แสดง', en: 'Show' },
  hide: { th: 'ซ่อน', en: 'Hide' },
  edit: { th: 'แก้ไข', en: 'Edit' },
  label: { th: 'หัวข้อ', en: 'Label' },
  value: { th: 'ข้อมูล', en: 'Value' },
  sensitive: { th: 'ซ่อนข้อมูล (เช่น เลขบัตร)', en: 'Mask value (e.g. ID numbers)' },
  done: { th: 'เสร็จ', en: 'Done' },
  delete: { th: 'ลบ', en: 'Delete' },
  confirmDelete: { th: 'ยืนยันลบ?', en: 'Delete for sure?' },
  add: { th: 'เพิ่มหัวข้อ', en: 'Add a heading' },
  custom: { th: '+ อื่น ๆ', en: '+ Custom' },
  backup: { th: 'สำรอง / กู้คืน', en: 'Backup / restore' },
  copyBackup: { th: 'คัดลอกข้อมูลสำรอง', en: 'Copy backup' },
  restore: { th: 'กู้คืนจากข้อมูลสำรอง', en: 'Restore from backup' },
  restoreHint: { th: 'วางข้อมูลสำรองที่นี่ จะแทนที่ข้อมูลปัจจุบันทั้งหมด', en: 'Paste a backup here. It replaces everything currently saved' },
  restoreBtn: { th: 'กู้คืน', en: 'Restore' },
  restoreBad: { th: 'ไม่ใช่ข้อมูลสำรองของ Normalday', en: "That isn't a Normalday backup" },
  restored: { th: 'กู้คืนแล้ว', en: 'Restored' },
  items: { th: 'รายการ', en: 'items' },
  privacy: {
    th: 'ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ถูกอัปโหลดที่ไหน และไม่ซิงก์ข้ามเครื่อง หากล้างข้อมูลเบราว์เซอร์ข้อมูลจะหาย จึงควรสำรองไว้',
    en: 'Stored only in this browser. Nothing is uploaded and it does not sync between devices. Clearing browser data erases it, so keep a backup.',
  },
} as const;

const viewState = z.object({ entries: z.array(detailEntry).max(MAX_ENTRIES) });
const DEFAULTS: z.infer<typeof viewState> = { entries: [] };

const field =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-base outline-none placeholder:text-ink-soft/70 focus:border-brand';
const iconBtn = 'grid size-10 shrink-0 place-items-center rounded-xl text-sm text-ink-soft hover:bg-surface-2';

export default function MyDetailsView() {
  const { t } = useLang();
  const [s, setS] = usePersistentState('my-details', viewState, DEFAULTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [note, setNote] = useState('');

  const flash = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  };

  const update = (id: string, patch: Partial<DetailEntry>) =>
    setS((p) => ({ entries: p.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const add = (label: string, hidden: boolean) => {
    const entry: DetailEntry = { id: newId(), label, value: '', hidden };
    setS((p) => ({ entries: [...p.entries, entry] }));
    setEditingId(entry.id);
  };

  const remove = (id: string) => {
    setS((p) => ({ entries: p.entries.filter((e) => e.id !== id) }));
    setEditingId(null);
    setDeleteId(null);
  };

  const copyEntry = async (e: DetailEntry) => {
    if (e.value.trim() === '') return setEditingId(e.id);
    // If the browser blocks clipboard access, open the editor so the text can be selected by hand.
    if (await copyText(e.value.trim())) flash(e.id);
    else setEditingId(e.id);
  };

  const copyAll = async () => {
    if (await copyText(formatDetails({ entries: s.entries, includeLabels: true }).text)) flash('all');
  };

  const used = new Set(s.entries.map((e) => e.label));
  const presets = DETAIL_PRESETS.filter((p) => !used.has(p.label.th) && !used.has(p.label.en));
  const canAdd = s.entries.length < MAX_ENTRIES;

  return (
    <div className="space-y-4">
      <Card
        icon="🪪"
        title={t(L.mine)}
        action={
          s.entries.some((e) => e.value.trim()) && (
            <Button variant="ghost" onClick={copyAll}>
              {copiedId === 'all' ? t(S.copied) : `📋 ${t(L.copyAll)}`}
            </Button>
          )
        }
      >
        {s.entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">{t(L.empty)}</p>
        ) : (
          <>
            <p className="-mt-1 mb-2 text-xs text-ink-soft">{t(L.tapToCopy)}</p>
            <ul className="divide-y divide-line">
              {s.entries.map((e) =>
                editingId === e.id ? (
                  <li key={e.id} className="my-2 space-y-2 rounded-xl border border-brand p-3">
                    <input
                      aria-label={t(L.label)}
                      placeholder={t(L.label)}
                      value={e.label}
                      maxLength={60}
                      onChange={(ev) => update(e.id, { label: ev.target.value })}
                      className={field}
                    />
                    <textarea
                      aria-label={t(L.value)}
                      placeholder={t(L.value)}
                      value={e.value}
                      rows={e.value.includes('\n') || e.value.length > 40 ? 4 : 2}
                      maxLength={2000}
                      autoFocus
                      onChange={(ev) => update(e.id, { value: ev.target.value })}
                      className={`${field} resize-y`}
                    />
                    <Switch checked={e.hidden} onChange={(v) => update(e.id, { hidden: v })} label={t(L.sensitive)} />
                    <div className="flex items-center justify-between gap-2">
                      {deleteId === e.id ? (
                        <Button variant="ghost" className="text-danger" onClick={() => remove(e.id)}>
                          {t(L.confirmDelete)}
                        </Button>
                      ) : (
                        <Button variant="ghost" onClick={() => setDeleteId(e.id)}>
                          🗑 {t(L.delete)}
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setEditingId(null);
                          setDeleteId(null);
                        }}
                      >
                        {t(L.done)}
                      </Button>
                    </div>
                  </li>
                ) : (
                  <li key={e.id} className="flex items-stretch gap-1 py-1">
                    <button
                      type="button"
                      onClick={() => copyEntry(e)}
                      className="min-w-0 flex-1 rounded-xl px-2 py-2 text-left hover:bg-surface-2 active:bg-surface-2"
                    >
                      <span className="block text-xs text-ink-soft">{e.label.trim() || t(L.unnamed)}</span>
                      {e.value.trim() === '' ? (
                        <span className="block text-sm text-ink-soft/70 italic">{t(L.noValue)}</span>
                      ) : (
                        <span className="block text-base break-words whitespace-pre-line">
                          {e.hidden && !revealed.includes(e.id) ? maskValue(e.value) : e.value}
                        </span>
                      )}
                      {copiedId === e.id && <span className="text-xs font-semibold text-brand-strong">{t(S.copied)}</span>}
                    </button>
                    {e.hidden && e.value.trim() !== '' && (
                      <button
                        type="button"
                        className={iconBtn}
                        aria-label={revealed.includes(e.id) ? t(L.hide) : t(L.show)}
                        title={revealed.includes(e.id) ? t(L.hide) : t(L.show)}
                        onClick={() => setRevealed((r) => (r.includes(e.id) ? r.filter((x) => x !== e.id) : [...r, e.id]))}
                      >
                        {revealed.includes(e.id) ? '🙈' : '👁'}
                      </button>
                    )}
                    <button type="button" className={iconBtn} aria-label={t(L.edit)} title={t(L.edit)} onClick={() => setEditingId(e.id)}>
                      ✎
                    </button>
                  </li>
                ),
              )}
            </ul>
          </>
        )}
      </Card>

      {canAdd && (
        <Card icon="➕" title={t(L.add)}>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label.en}
                type="button"
                onClick={() => add(t(p.label), p.hidden)}
                className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-brand hover:text-brand-strong"
              >
                {t(p.label)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => add('', false)}
              className="rounded-full border border-dashed border-brand px-2.5 py-1 text-xs font-medium text-brand-strong"
            >
              {t(L.custom)}
            </button>
          </div>
        </Card>
      )}

      <Card icon="💾" title={t(L.backup)}>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              if (await copyText(serializeBackup(s.entries))) flash('backup');
            }}
          >
            {copiedId === 'backup' ? t(S.copied) : `📋 ${t(L.copyBackup)}`}
          </Button>
          <Button variant="ghost" onClick={() => setShowRestore((v) => !v)}>
            {t(L.restore)}
          </Button>
        </div>
        {showRestore && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-ink-soft">{t(L.restoreHint)}</p>
            <textarea
              aria-label={t(L.restore)}
              value={restoreText}
              rows={4}
              onChange={(ev) => {
                setRestoreText(ev.target.value);
                setNote('');
              }}
              className={`${field} font-mono text-xs`}
            />
            <Button
              onClick={() => {
                const entries = parseBackup(restoreText);
                if (!entries) return setNote(t(L.restoreBad));
                setS({ entries });
                setRestoreText('');
                setShowRestore(false);
                setEditingId(null);
                setNote(`${t(L.restored)} ${entries.length} ${t(L.items)}`);
              }}
            >
              {t(L.restoreBtn)}
            </Button>
          </div>
        )}
        {note && <p className="mt-2 text-sm font-medium text-brand-strong">{note}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">🔒 {t(L.privacy)}</p>
      </Card>
    </div>
  );
}
