<?php

namespace App\Http\Middleware;

use App\Models\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Lang;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $module, string $action = 'view'): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->hasPermission($module, $action)) {
            abort(403, __('errors.permission', [
                'action' => __("errors.actions.{$action}"),
                'module' => $this->moduleLabel($module),
            ]));
        }

        return $next($request);
    }

    /** Le nom du module tel que l'écran Permissions l'affiche. */
    private function moduleLabel(string $module): string
    {
        $key = "errors.modules.{$module}";

        return Lang::has($key, null, false) ? __($key) : (UserPermission::MODULES[$module] ?? $module);
    }
}
