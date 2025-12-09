import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyLibrary from './MyLibrary';
import UserContext from '../../contexts/UserContext';

const mockUseFetch = vi.fn();
vi.mock('../../hooks/useRequest', () => ({
    useFetch: (...args) => mockUseFetch(...args),
    useRequest: () => ({ request: vi.fn() }),
}));

const renderMyLibrary = (contextValue = {}) => {
    const defaultContext = {
        user: { _id: 'user1', accessToken: 'token123' },
        isAuthenticated: true,
        ...contextValue,
    };

    return render(
        <MemoryRouter>
            <UserContext.Provider value={defaultContext}>
                <MyLibrary />
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('MyLibrary Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseFetch.mockReturnValue({ data: null, loading: false });
    });

    it('shows loading state while fetching shelves', () => {
        mockUseFetch.mockReturnValue({ data: null, loading: true });

        renderMyLibrary();

        expect(screen.getByText(/loading your library/i)).toBeInTheDocument();
    });

    it('renders library page with stats and shelf links', () => {
        mockUseFetch.mockImplementation((path) => {
            if (path?.includes('/data/shelves')) {
                return {
                    data: [{ read: ['b1'], currentlyReading: ['b2'], 'to-read': ['b3'] }],
                    loading: false,
                };
            }
            if (path?.includes('/data/books')) {
                return { data: [{ _id: 'b2', title: 'Test Book' }], loading: false };
            }
            if (path?.includes('count=true')) {
                return { data: 2, loading: false };
            }
            return { data: null, loading: false };
        });

        renderMyLibrary();

        expect(screen.getByRole('heading', { name: /my library/i })).toBeInTheDocument();
        expect(screen.getByText(/total books/i)).toBeInTheDocument();
    });

    it('shows empty state when no books in shelves', () => {
        mockUseFetch.mockImplementation((path) => {
            if (path?.includes('/data/shelves')) {
                return { data: [{ read: [], currentlyReading: [], 'to-read': [] }], loading: false };
            }
            if (path?.includes('count=true')) {
                return { data: 0, loading: false };
            }
            return { data: null, loading: false };
        });

        renderMyLibrary();

        expect(screen.getByRole('heading', { name: /my library/i })).toBeInTheDocument();
    });
});
