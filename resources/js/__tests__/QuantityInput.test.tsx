import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import QuantityInput from '@/Components/QuantityInput';

/** Comme l'écran de vente : un champ illisible devient 0 dans le panier. */
function SaleLine({ initial = 1, unit = 'piece' }: { initial?: number; unit?: string }) {
    const [quantity, setQuantity] = useState(initial);

    return (
        <>
            <QuantityInput value={quantity} unit={unit} onChange={(q) => setQuantity(q ?? 0)} />
            <output data-testid="cart">{quantity}</output>
            <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
        </>
    );
}

describe('QuantityInput', () => {
    it('stays empty once cleared, instead of snapping back to 0', () => {
        render(<SaleLine />);
        const input = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '' } });

        expect(input.value).toBe('');
        expect(screen.getByTestId('cart').textContent).toBe('0');
    });

    it('takes the typed quantity after clearing', () => {
        render(<SaleLine />);
        const input = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '' } });
        fireEvent.change(input, { target: { value: '12' } });

        expect(input.value).toBe('12');
        expect(screen.getByTestId('cart').textContent).toBe('12');
    });

    it('still follows a change made elsewhere, even from an empty field', () => {
        render(<SaleLine />);
        const input = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '' } });
        fireEvent.click(screen.getByText('+'));

        expect(input.value).toBe('1');
    });

    it('selects the quantity on focus so typing replaces it', () => {
        render(<SaleLine initial={3} />);
        const input = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.focus(input);

        expect(input.selectionStart).toBe(0);
        expect(input.selectionEnd).toBe(1);
    });

    it('ignores letters, typed or pasted', () => {
        render(<SaleLine />);
        const input = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '1a2b' } });

        expect(input.value).toBe('12');
        expect(screen.getByTestId('cart').textContent).toBe('12');
    });

    it('keeps a single decimal separator for a divisible unit, none for pieces', () => {
        const { unmount } = render(<SaleLine unit="kg" />);
        const kg = screen.getByRole('textbox') as HTMLInputElement;
        fireEvent.change(kg, { target: { value: '1,5,2kg' } });
        expect(kg.value).toBe('1,52');
        unmount();

        render(<SaleLine />);
        const piece = screen.getByRole('textbox') as HTMLInputElement;
        fireEvent.change(piece, { target: { value: '1,5' } });
        expect(piece.value).toBe('15');
    });
});
