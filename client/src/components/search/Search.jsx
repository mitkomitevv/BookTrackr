import { useEffect, useState, useRef } from "react";

export default function Search({ value, onChange, onSearch, placeholder, className, debounceMs }) {
    const [input, setInput] = useState(value ?? "");
    const timer = useRef(null);

    // keep local input in sync when parent value changes
    useEffect(() => {
        setInput(value ?? "");
    }, [value]);

    useEffect(() => {
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, []);

    const handleChange = (v) => {
        setInput(v);
        if (!debounceMs) {
            onChange && onChange(v);
            return;
        }
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            onChange && onChange(v);
            timer.current = null;
        }, debounceMs);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }
            onChange && onChange(input);
            onSearch && onSearch(input);
        }
    };

    const clear = () => {
        if (timer.current) { clearTimeout(timer.current); timer.current = null; }
        setInput("");
        onChange && onChange("");
    };

    return (
        <div className={className}>
            <div className="relative">
                <input
                    value={input}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || "Search..."}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {input && (
                    <button onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm">✕</button>
                )}
            </div>
        </div>
    );
}
