// src/components/details/BookDetails.jsx
import Breadcrumbs from "./Breadcrumbs";
import BookHeaderSection from "./BookHeaderSection";
import BookReviewsSection from "./BookReviewsSection";
import BookSidebar from "./BookSidebar";

export default function BookDetails() {
    return (
        <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                <Breadcrumbs />

                {/* Top: cover + main info */}
                <BookHeaderSection />

                {/* Bottom: reviews + sidebar */}
                <section className="flex flex-col lg:flex-row gap-8 pt-4 pb-8 border-t border-slate-900">
                    <div className="flex-1">
                        <BookReviewsSection />
                    </div>
                    <BookSidebar />
                </section>
            </div>
        </main>
    );
}
