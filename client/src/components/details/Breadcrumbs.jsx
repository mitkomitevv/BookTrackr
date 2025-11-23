// src/components/details/Breadcrumbs.jsx
export default function Breadcrumbs() {
    return (
        <nav className="text-xs text-slate-400 flex items-center gap-1">
            <a href="#" className="hover:text-emerald-400">
                Browse
            </a>
            <span>/</span>
            <a href="#" className="hover:text-emerald-400">
                Fantasy
            </a>
            <span>/</span>
            <span className="text-slate-500">The House Between Seasons</span>
        </nav>
    );
}
