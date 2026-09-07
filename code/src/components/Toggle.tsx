type Props = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Toggle({ id, label, checked, onChange }: Props) {
  return (
    <div className="flex gap-2 items-baseline">
      <div className="relative inline-block w-8 h-6 self-center">
        <input
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          id={id}
          type="checkbox"
          className="peer appearance-none w-8 h-5 bg-slate-100 rounded-full checked:bg-blue-600 cursor-pointer transition-colors duration-50"
        />
        <label
          htmlFor={id}
          className="absolute top-0 left-0 w-5 h-5 bg-white rounded-full border border-slate-300 shadow-sm transition-transform duration-50 peer-checked:translate-x-3 peer-checked:border-slate-800 cursor-pointer"
        />
      </div>
      <label htmlFor={id} className="text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}
