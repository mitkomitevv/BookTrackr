export default function Footer() {
    return (
        <footer className="border-t border-slate-800 bg-slate-950">
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <p>© 2025 BookTrackr. Built for readers, by readers.</p>
                <div className="flex items-center gap-4">
                    <a href="#" className="hover:text-emerald-400">
                        About
                    </a>
                    <a href="#" className="hover:text-emerald-400">
                        Contact
                    </a>
                    <a href="#" className="hover:text-emerald-400">
                        Terms
                    </a>
                </div>
            </div>
        </footer>
    );
}
