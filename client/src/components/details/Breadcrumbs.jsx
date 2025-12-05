import { Link } from "react-router";

export default function Breadcrumbs({
    title
}) {
    return (
        <nav className="text-xs text-slate-400 flex items-center gap-1">
            <Link to='/catalog' className="hover:text-emerald-400">
                Browse
            </Link>
            <span>/</span>
            <span className="text-slate-500">{title}</span>
        </nav>
    );
}
