import { HardHat } from 'lucide-react';
import { SVGAttributes } from 'react';

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
       <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-300 p-2 text-slate-900">
                <HardHat className="size-5" />
            </div>
            <div>
                <p className="text-sm font-bold tracking-wide text-slate-900">BATIX SAAS</p>
                <p className="text-xs text-slate-600">Gestion moderne des quincailleries</p>
            </div>
        </div>
    );
}
