import { afterEach, describe, expect, it, vi } from 'vitest';
import { periodOf } from '@/utils/salesExportPeriod';

describe("périodes de l'export des ventes", () => {
    afterEach(() => vi.useRealTimers());

    // Jeudi 23 octobre 2026, 00:30 : tôt le matin pour qu'un calcul en UTC change de jour.
    const at = (iso: string) => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(iso));
    };

    it("aujourd'hui et hier", () => {
        at('2026-10-23T00:30:00');
        expect(periodOf('today')).toEqual({ from: '2026-10-23', to: '2026-10-23' });
        expect(periodOf('yesterday')).toEqual({ from: '2026-10-22', to: '2026-10-22' });
    });

    it('la semaine commence le lundi, même un dimanche', () => {
        at('2026-10-23T10:00:00');
        expect(periodOf('week')).toEqual({ from: '2026-10-19', to: '2026-10-23' });
        at('2026-10-25T10:00:00');
        expect(periodOf('week')).toEqual({ from: '2026-10-19', to: '2026-10-25' });
    });

    it('ce mois et le mois dernier, y compris en janvier', () => {
        at('2026-10-23T10:00:00');
        expect(periodOf('month')).toEqual({ from: '2026-10-01', to: '2026-10-23' });
        expect(periodOf('lastMonth')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
        at('2027-01-05T10:00:00');
        expect(periodOf('lastMonth')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    });
});
