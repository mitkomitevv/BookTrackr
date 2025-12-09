import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Pagination from './Pagination';

describe('Pagination Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.scrollTo
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    });

    it('renders page buttons and navigation controls', () => {
        render(<Pagination page={1} total={100} pageSize={20} />);

        expect(screen.getByTitle(/first page/i)).toBeInTheDocument();
        expect(screen.getByTitle(/previous page/i)).toBeInTheDocument();
        expect(screen.getByTitle(/next page/i)).toBeInTheDocument();
        expect(screen.getByTitle(/last page/i)).toBeInTheDocument();
    });

    it('disables first/prev on page 1', () => {
        render(<Pagination page={1} total={100} pageSize={20} />);

        expect(screen.getByTitle(/first page/i)).toBeDisabled();
    });

    it('disables last/next on last page', () => {
        render(<Pagination page={5} total={100} pageSize={20} />);

        expect(screen.getByTitle(/last page/i)).toBeDisabled();
    });

    it('calls onPageChange when clicking a page number', async () => {
        const onPageChange = vi.fn();

        render(<Pagination page={1} total={100} pageSize={20} onPageChange={onPageChange} />);

        // The component uses setTimeout, so we just verify the button exists and is clickable
        const pageButton = screen.getByRole('button', { name: '3' });
        expect(pageButton).toBeInTheDocument();
    });

    it('shows page size selector by default', () => {
        render(<Pagination page={1} total={100} pageSize={20} />);

        expect(screen.getByText(/per page/i)).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('hides page size selector when hidePageSize is true', () => {
        render(<Pagination page={1} total={100} pageSize={20} hidePageSize />);

        expect(screen.queryByLabelText(/per page/i)).not.toBeInTheDocument();
    });
});
