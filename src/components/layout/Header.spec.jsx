import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import UserContext from '../../contexts/UserContext';

vi.mock('../search/Search', () => ({
    default: ({ placeholder }) => (
        <input data-testid="search" placeholder={placeholder} />
    ),
}));

const renderHeader = (contextValue = {}) => {
    const defaultContext = {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        ...contextValue,
    };

    return render(
        <MemoryRouter>
            <UserContext.Provider value={defaultContext}>
                <Header />
            </UserContext.Provider>
        </MemoryRouter>,
    );
};

describe('Header Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders logo and common nav links', () => {
        renderHeader();

        expect(screen.getByText('BookTrackr')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /browse/i }),
        ).toBeInTheDocument();
    });

    it('shows login/signup when not authenticated', () => {
        renderHeader({ isAuthenticated: false });

        expect(
            screen.getByRole('link', { name: /log in/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /sign up/i }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /my library/i }),
        ).not.toBeInTheDocument();
    });

    it('shows user links when authenticated', () => {
        renderHeader({
            isAuthenticated: true,
            user: { _id: '1', accessToken: 'tok' },
        });

        expect(
            screen.getByRole('link', { name: /my library/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /add book/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /sign out/i }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /log in/i }),
        ).not.toBeInTheDocument();
    });

    it('shows admin link when user is admin', () => {
        renderHeader({
            isAuthenticated: true,
            isAdmin: true,
            user: { _id: '1' },
        });

        expect(
            screen.getByRole('link', { name: /admin/i }),
        ).toBeInTheDocument();
    });

    it('hides admin link for non-admin users', () => {
        renderHeader({
            isAuthenticated: true,
            isAdmin: false,
            user: { _id: '1' },
        });

        expect(
            screen.queryByRole('link', { name: /admin/i }),
        ).not.toBeInTheDocument();
    });
});
