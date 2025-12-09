import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Catalog from './Catalog';
import UserContext from '../../contexts/UserContext';

const mockUseFetch = vi.fn();
vi.mock('../../hooks/useRequest', () => ({
    useFetch: (...args) => mockUseFetch(...args),
}));

vi.mock('../../hooks/useSearchQuery', () => ({
    default: () => '',
}));

vi.mock('../book-card/BookCard', () => ({
    default: ({ title }) => <div data-testid="book-card">{title}</div>,
}));

vi.mock('../my-library/CurrentlyReadingCard', () => ({
    default: ({ book }) => <div data-testid="reading-card">{book.title}</div>,
}));

vi.mock('../ui/Pagination', () => ({
    default: () => <div data-testid="pagination">Pagination</div>,
}));

const renderCatalog = (contextValue = {}, route = '/catalog') => {
    const defaultContext = {
        user: null,
        isAuthenticated: false,
        ...contextValue,
    };

    return render(
        <MemoryRouter initialEntries={[route]}>
            <UserContext.Provider value={defaultContext}>
                <Catalog />
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('Catalog Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state', () => {
        mockUseFetch.mockReturnValue({ data: null, loading: true, error: null, refetch: vi.fn() });

        renderCatalog();

        expect(screen.getByText(/loading books/i)).toBeInTheDocument();
    });

    it('shows error message on fetch failure', () => {
        mockUseFetch.mockReturnValue({
            data: null,
            loading: false,
            error: { payload: { message: 'Server error' } },
            refetch: vi.fn(),
        });

        renderCatalog();

        expect(screen.getByText(/server error|failed to load/i)).toBeInTheDocument();
    });

    it('renders book cards when data loads', () => {
        mockUseFetch.mockImplementation((path) => {
            if (path?.includes('count=true')) {
                return { data: 2, loading: false, refetch: vi.fn() };
            }
            return {
                data: [
                    { _id: '1', title: 'Book One' },
                    { _id: '2', title: 'Book Two' },
                ],
                loading: false,
                error: null,
                refetch: vi.fn(),
            };
        });

        renderCatalog();

        expect(screen.getByRole('heading', { name: /browse books/i })).toBeInTheDocument();
        expect(screen.getAllByTestId('book-card')).toHaveLength(2);
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('shows empty grid when no books', () => {
        mockUseFetch.mockReturnValue({ data: [], loading: false, error: null, refetch: vi.fn() });

        renderCatalog();

        expect(screen.queryByTestId('book-card')).not.toBeInTheDocument();
    });
});
