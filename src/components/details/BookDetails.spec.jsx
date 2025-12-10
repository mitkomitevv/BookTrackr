import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookDetails from './BookDetails';

// Mock child components to isolate BookDetails
vi.mock('./Breadcrumbs', () => ({
    default: ({ title }) => <nav data-testid="breadcrumbs">{title}</nav>,
}));
vi.mock('./BookHeaderSection', () => ({
    default: (props) => <div data-testid="header-section">{props.title}</div>,
}));
vi.mock('./BookReviewsSection', () => ({
    default: () => <div data-testid="reviews-section">Reviews</div>,
}));
vi.mock('./BookSidebar', () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));

const mockUseFetch = vi.fn();
vi.mock('../../hooks/useRequest', () => ({
    useFetch: (...args) => mockUseFetch(...args),
}));

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useParams: () => ({ bookId: '123' }),
    };
});

describe('BookDetails Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state', () => {
        mockUseFetch.mockReturnValue({
            data: null,
            loading: true,
            error: null,
        });

        render(
            <MemoryRouter>
                <BookDetails />
            </MemoryRouter>,
        );

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows not found when book is missing', () => {
        mockUseFetch.mockReturnValue({
            data: null,
            loading: false,
            error: { message: 'Not found' },
        });

        render(
            <MemoryRouter>
                <BookDetails />
            </MemoryRouter>,
        );

        expect(screen.getByText(/book not found/i)).toBeInTheDocument();
    });

    it('renders book details when data loads', () => {
        mockUseFetch.mockReturnValue({
            data: { _id: '123', title: 'Test Book', author: 'Test Author' },
            loading: false,
            error: null,
        });

        render(
            <MemoryRouter>
                <BookDetails />
            </MemoryRouter>,
        );

        expect(screen.getByTestId('breadcrumbs')).toHaveTextContent(
            'Test Book',
        );
        expect(screen.getByTestId('header-section')).toHaveTextContent(
            'Test Book',
        );
        expect(screen.getByTestId('reviews-section')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
});
