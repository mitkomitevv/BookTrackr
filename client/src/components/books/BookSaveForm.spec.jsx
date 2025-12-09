import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookSaveForm from './BookSaveForm';
import UserContext from '../../contexts/UserContext';

// Mock hooks
vi.mock('../../hooks/useRequest', () => ({
    useFetch: vi.fn(() => ({ data: null, loading: false, error: null })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({}),
    };
});

const mockFormRequest = {
    registerInput: vi.fn((name) => ({ name, value: '', onChange: vi.fn() })),
    formProps: { onSubmit: vi.fn((e) => e.preventDefault()) },
    loading: false,
    error: null,
    reset: vi.fn(),
};

vi.mock('../../hooks/useFormRequest', () => ({
    useFormRequest: vi.fn(() => mockFormRequest),
}));

const renderBookSaveForm = (contextValue = {}) => {
    const defaultContext = {
        user: { _id: 'user1', accessToken: 'token123' },
        isAuthenticated: true,
        ...contextValue,
    };

    return render(
        <MemoryRouter>
            <UserContext.Provider value={defaultContext}>
                <BookSaveForm />
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('BookSaveForm Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the add book form with required fields', () => {
        renderBookSaveForm();

        expect(screen.getByRole('heading', { name: /add a new book/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/book title/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/author name/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save book/i })).toBeInTheDocument();
    });

    it('shows cancel button that navigates back', async () => {
        const user = userEvent.setup();
        renderBookSaveForm();

        const cancelBtn = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/catalog');
    });

    it('validates required fields on blur', async () => {
        const user = userEvent.setup();
        renderBookSaveForm();

        const titleInput = screen.getByLabelText(/title/i);
        await user.click(titleInput);
        await user.tab();

        expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    });
});
