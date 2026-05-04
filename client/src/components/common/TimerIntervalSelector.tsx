import { useState } from 'react';

type Unit = 'minutes' | 'hours' | 'days' | 'weeks';

const UNIT_LABELS: Record<Unit, string> = {
  minutes: 'Min',
  hours: 'Hours',
  days: 'Days',
  weeks: 'Weeks',
};

const PRESETS: Array<{ label: string; count: number; unit: Unit }> = [
  { label: '15m', count: 15, unit: 'minutes' },
  { label: '1h',  count: 1,  unit: 'hours'   },
  { label: '6h',  count: 6,  unit: 'hours'   },
  { label: '12h', count: 12, unit: 'hours'   },
  { label: '1d',  count: 1,  unit: 'days'    },
  { label: '3d',  count: 3,  unit: 'days'    },
  { label: '1w',  count: 1,  unit: 'weeks'   },
];

function minutesToCountUnit(minutes: number): { count: number; unit: Unit } {
  if (minutes % (7 * 1440) === 0 && minutes >= 7 * 1440)
    return { count: minutes / (7 * 1440), unit: 'weeks' };
  if (minutes % 1440 === 0 && minutes >= 1440)
    return { count: minutes / 1440, unit: 'days' };
  if (minutes % 60 === 0 && minutes >= 60)
    return { count: minutes / 60, unit: 'hours' };
  return { count: minutes, unit: 'minutes' };
}

function toMinutes(count: number, unit: Unit): number {
  if (unit === 'hours') return count * 60;
  if (unit === 'days') return count * 1440;
  if (unit === 'weeks') return count * 7 * 1440;
  return count;
}

function convertCount(count: number, from: Unit, to: Unit): number {
  return Math.max(1, Math.round(toMinutes(count, from) / toMinutes(1, to)));
}

function summarize(count: number, unit: Unit, time: string, showTime: boolean): string {
  const plural = (n: number, word: string) => `${n} ${word}${n !== 1 ? 's' : ''}`;
  const base = `Every ${
    unit === 'minutes' ? plural(count, 'minute') :
    unit === 'hours'   ? plural(count, 'hour')   :
    unit === 'days'    ? plural(count, 'day')     :
                         plural(count, 'week')
  }`;
  return showTime ? `${base} at ${time}` : base;
}

function normalizeTime(raw: string): string {
  const match = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return raw;
  const h = Math.min(23, parseInt(match[1], 10)).toString().padStart(2, '0');
  const m = Math.min(59, parseInt(match[2], 10)).toString().padStart(2, '0');
  return `${h}:${m}`;
}

interface TimerIntervalSelectorProps {
  value: number;
  scheduledTime?: string;
  onChange: (minutes: number, scheduledTime?: string) => void;
}

export function TimerIntervalSelector({ value, scheduledTime, onChange }: TimerIntervalSelectorProps) {
  const initial = minutesToCountUnit(value);
  const [count, setCount] = useState(initial.count);
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [time, setTime] = useState(scheduledTime ?? '09:00');

  const showTime = unit === 'days' || unit === 'weeks';

  function emit(c: number, u: Unit, t: string) {
    onChange(toMinutes(c, u), u === 'days' || u === 'weeks' ? t : undefined);
  }

  function handleCount(e: React.ChangeEvent<HTMLInputElement>) {
    const c = Math.max(1, parseInt(e.target.value, 10) || 1);
    setCount(c);
    emit(c, unit, time);
  }

  function handleUnit(u: Unit) {
    const converted = convertCount(count, unit, u);
    setCount(converted);
    setUnit(u);
    emit(converted, u, time);
  }

  function handlePreset(p: (typeof PRESETS)[0]) {
    setCount(p.count);
    setUnit(p.unit);
    emit(p.count, p.unit, time);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Check Interval</label>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 shrink-0">Every</span>
        <input
          type="number"
          min={1}
          value={count}
          onChange={handleCount}
          className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:border-indigo-500 focus:outline-none"
        />
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
          {(['minutes', 'hours', 'days', 'weeks'] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnit(u)}
              className={`px-3 py-2 transition-colors ${
                unit === u ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {UNIT_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      {showTime && (
        <div className="flex items-center gap-1.5 pl-1">
          <span className="text-sm text-gray-500 shrink-0">At</span>
          <input
            type="text"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              if (/^\d{2}:\d{2}$/.test(e.target.value)) emit(count, unit, e.target.value);
            }}
            onBlur={(e) => {
              const normalized = normalizeTime(e.target.value);
              setTime(normalized);
              emit(count, unit, normalized);
            }}
            placeholder="09:00"
            maxLength={5}
            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        {PRESETS.map((p) => {
          const active = p.count === count && p.unit === unit;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                active
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-indigo-600 pl-0.5">{summarize(count, unit, time, showTime)}</p>
    </div>
  );
}
