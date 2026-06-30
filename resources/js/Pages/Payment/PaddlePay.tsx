import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
    interface Window {
        Paddle: any;
    }
}

export default function PaddlePay() {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;
        script.onload = () => {
            if (window.Paddle) {
                const env = import.meta.env.VITE_PADDLE_ENV || 'sandbox';

                if (env === 'sandbox') {
                    window.Paddle.Environment.set('sandbox');
                }

                window.Paddle.Initialize({
                    token: import.meta.env.VITE_PADDLE_CLIENT_SIDE_TOKEN,
                    eventCallback: function (event: any) {
                        if (event.name === 'checkout.completed') {
                            window.location.href = '/paddle/success';
                        }
                    },
                });
            }
        };

        document.body.appendChild(script);
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading secure checkout...</p>
            </div>
        </div>
    );
}
