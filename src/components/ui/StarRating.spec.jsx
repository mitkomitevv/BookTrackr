import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StarRating from './StarRating';

describe('StarRating Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders 5 stars', () => {
        render(<StarRating value={0} />);

        // All empty stars when value is 0
        expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    it('displays filled stars matching value', () => {
        render(<StarRating value={3} readonly />);

        const stars = screen.getAllByText(/★|☆/);
        const filled = stars.filter((s) => s.textContent === '★');
        expect(filled).toHaveLength(3);
    });

    it('calls onChange when clicking a star', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<StarRating value={0} onChange={onChange} />);

        await user.click(screen.getAllByRole('button')[2]); // 3rd star

        expect(onChange).toHaveBeenCalledWith(3);
    });

    it('toggles off when clicking the same value', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<StarRating value={3} onChange={onChange} />);

        await user.click(screen.getAllByRole('button')[2]); // click 3rd star again

        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('shows label when showLabel is true', () => {
        render(<StarRating value={4} showLabel readonly />);

        expect(screen.getByText('4/5')).toBeInTheDocument();
    });

    it('does not render buttons in readonly mode', () => {
        render(<StarRating value={3} readonly />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
