@php
    // Une page d'erreur ne doit jamais elle-même échouer : pendant une 500 (base
    // indisponible), lire l'utilisateur peut lever une exception.
    try {
        $user = auth()->user();
        // Les URLs portent le code du PROPRIÉTAIRE du compte, pas celui de l'employé.
        $accountCode = $user?->accountCode();
        $homeUrl = match (true) {
            $user?->role === 'admin_platforme' => route('platform.dashboard'),
            (bool) $accountCode => route('dashboard', ['code_user' => $accountCode]),
            default => url('/'),
        };
    } catch (\Throwable) {
        $user = null;
        $homeUrl = url('/');
    }
    $code = trim($__env->yieldContent('code'));
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>@yield('title') · BATIX PRO</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>
        :root { --bg: #FAF1EC; --card: #fff; --text: #1f2937; --muted: #6b7280; --brand: #A0522D; --brand-dark: #7E4024; --border: #F2DDCE; }
        @media (prefers-color-scheme: dark) {
            :root { --bg: #111827; --card: #1f2937; --text: #f3f4f6; --muted: #9ca3af; --brand: #D69A6B; --brand-dark: #E4BC9C; --border: #374151; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px;
            background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.5; }
        .card { width: 100%; max-width: 440px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px 24px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,.06); }
        .logo { width: 48px; height: auto; margin: 0 auto 20px; display: block; }
        .code { display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: .04em; color: var(--brand); background: color-mix(in srgb, var(--brand) 12%, transparent); padding: 2px 10px; border-radius: 999px; }
        h1 { font-size: 22px; margin: 12px 0 8px; }
        p { margin: 0 0 8px; color: var(--muted); font-size: 15px; }
        p.detail { color: var(--text); font-weight: 500; }
        .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
        .btn { display: block; padding: 12px 16px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; border: 1px solid var(--border); color: var(--text); background: transparent; cursor: pointer; font-family: inherit; }
        .btn.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
        .btn.primary:hover { background: var(--brand-dark); }
        @media (min-width: 480px) { .actions { flex-direction: row-reverse; justify-content: center; } }
    </style>
</head>
<body>
    <main class="card">
        <img class="logo" src="/images/logo-batixpro-mark.png" alt="BATIX PRO">
        <span class="code">{{ __('errors.code', ['code' => $code]) }}</span>
        <h1>@yield('title')</h1>
        @hasSection('detail')
            <p class="detail">@yield('detail')</p>
        @endif
        @hasSection('message')
            <p>@yield('message')</p>
        @endif

        <div class="actions">
            @hasSection('actions')
                @yield('actions')
            @else
                <a class="btn primary" href="{{ $homeUrl }}">{{ $user ? __('errors.dashboard') : __('errors.home') }}</a>
                <button type="button" class="btn" onclick="history.length > 1 ? history.back() : location.assign('{{ $homeUrl }}')">{{ __('errors.back') }}</button>
            @endif
        </div>
    </main>
</body>
</html>
