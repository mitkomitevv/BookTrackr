import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import UserContext from '../../contexts/UserContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderLogin = (contextValue = {}) => {
    const defaultContext = {
        loginHandler: vi.fn(),
        isAuthenticated: false,
        user: null,
        ...contextValue,
    };

    return {
        ...render(
            <MemoryRouter>
                <UserContext.Provider value={defaultContext}>
                    <Login />
                </UserContext.Provider>
            </MemoryRouter>
        ),
        loginHandler: defaultContext.loginHandler,
    };
};

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the basic form elements', () => {
        renderLogin();

        expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('submits valid credentials and navigates home', async () => {
        const user = userEvent.setup();
        const { loginHandler } = renderLogin();
        loginHandler.mockResolvedValue({ accessToken: 'token123' });

        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(loginHandler).toHaveBeenCalledWith('test@example.com', 'password123', false);
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows validation when required fields are empty', async () => {
        const user = userEvent.setup();
        renderLogin();

        // Disable native form validation so React validation runs in tests
        document.querySelector('form')?.setAttribute('noValidate', 'true');

        await user.click(screen.getByRole('button', { name: /log in/i }));

        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows server error for invalid credentials (401)', async () => {
        const user = userEvent.setup();
        const { loginHandler } = renderLogin();
        loginHandler.mockRejectedValue({ status: 401 });

        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    });
});
