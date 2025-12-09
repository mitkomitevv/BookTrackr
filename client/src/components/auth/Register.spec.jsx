import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Register from './Register';
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

const renderRegister = (contextValue = {}) => {
    const defaultContext = {
        registerHandler: vi.fn(),
        isAuthenticated: false,
        user: null,
        ...contextValue,
    };

    return {
        ...render(
            <MemoryRouter>
                <UserContext.Provider value={defaultContext}>
                    <Register />
                </UserContext.Provider>
            </MemoryRouter>
        ),
        registerHandler: defaultContext.registerHandler,
    };
};

describe('Register Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the registration form essentials', () => {
        renderRegister();

        expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('validates required fields and matching passwords on submit', async () => {
        const user = userEvent.setup();
        renderRegister();

        // Disable native form validation so React validation runs in tests
        document.querySelector('form')?.setAttribute('noValidate', 'true');

        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/please confirm your password/i)).toBeInTheDocument();
    });

    it('submits valid data and navigates home', async () => {
        const user = userEvent.setup();
        const { registerHandler } = renderRegister();
        registerHandler.mockResolvedValue({ accessToken: 'token123' });

        await user.type(screen.getByLabelText(/full name/i), 'Jane Smith');
        await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/confirm password/i), 'password123');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(registerHandler).toHaveBeenCalledWith('jane@example.com', 'password123', 'Jane Smith');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows duplicate email error (409)', async () => {
        const user = userEvent.setup();
        const { registerHandler } = renderRegister();
        registerHandler.mockRejectedValue({ status: 409 });

        await user.type(screen.getByLabelText(/full name/i), 'Jane Smith');
        await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await user.type(screen.getByLabelText(/^password$/i), 'password123');
        await user.type(screen.getByLabelText(/confirm password/i), 'password123');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText(/this email is already registered/i)).toBeInTheDocument();
    });
});
