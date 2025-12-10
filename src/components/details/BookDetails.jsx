import Breadcrumbs from './Breadcrumbs';
import BookHeaderSection from './BookHeaderSection';
import BookReviewsSection from './BookReviewsSection';
import BookSidebar from './BookSidebar';
import { useParams } from 'react-router';
import { useFetch } from '../../hooks/useRequest';

export default function BookDetails() {
    const { bookId } = useParams();
    const { data: book, loading, error } = useFetch(`/data/books/${bookId}`);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="flex-1 flex items-center justify-center">
                Book not found
            </div>
        );
    }

    return (
        <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                <Breadcrumbs title={book.title} />

                <BookHeaderSection {...book} />

                <section className="flex flex-col lg:flex-row gap-8 pt-4 pb-8 border-t border-slate-900">
                    <div className="flex-1">
                        <BookReviewsSection
                            bookId={bookId}
                            bookTitle={book.title}
                        />
                    </div>
                    <BookSidebar bookId={bookId} />
                </section>
            </div>
        </main>
    );
}
