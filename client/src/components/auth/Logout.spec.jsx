import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Logout from './Logout';
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

const renderLogout = (contextValue = {}) => {
    const defaultContext = {
        logoutHandler: vi.fn(),
        isAuthenticated: true,
        user: { accessToken: 'token123' },
        ...contextValue,
    };

    return {
        ...render(
            <MemoryRouter>
                <UserContext.Provider value={defaultContext}>
                    <Logout />
                </UserContext.Provider>
            </MemoryRouter>
        ),
        logoutHandler: defaultContext.logoutHandler,
    };
};

describe('Logout Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls logout then navigates home on success', async () => {
        const logoutHandler = vi.fn().mockResolvedValue();
        renderLogout({ logoutHandler });

        await waitFor(() => {
            expect(logoutHandler).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows alert and still navigates home on failure', async () => {
        const logoutHandler = vi.fn().mockRejectedValue(new Error('Logout failed'));
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        renderLogout({ logoutHandler });

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Problem with logout');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });

        alertMock.mockRestore();
    });
});
