<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Display activity logs for current account and its users
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();

        $query = ActivityLog::query()
            ->with(['user', 'shop'])
            ->where('user_role', '!=', 'admin_platforme') // Exclure TOUJOURS admin_platforme
            ->latest();

        // Filter by account (code_user) - TOUS les utilisateurs sauf admin_platforme
        // voient uniquement les logs de leur compte
        if ($user->role !== 'admin_platforme') {
            $query->where('account_code', $user->accountCode());
        }
        // admin_platforme peut voir tous les logs de tous les comptes

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Filter by subject type
        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        }

        // Search in description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%");
            });
        }

        $activities = $query->paginate(50)->through(fn($activity) => [
            'id' => $activity->id,
            'user' => $activity->user ? [
                'id' => $activity->user->id,
                'name' => $activity->user->name,
                'email' => $activity->user->email,
                'role' => $activity->user->role,
            ] : [
                'name' => $activity->user_name,
                'email' => $activity->user_email,
                'role' => $activity->user_role,
            ],
            'shop' => $activity->shop ? [
                'id' => $activity->shop->id,
                'name' => $activity->shop->name,
            ] : [
                'name' => $activity->shop_name,
            ],
            'action' => $activity->action,
            'action_label' => $activity->action_label,
            'description' => $activity->translated_description,
            'subject_type' => $activity->subject_type,
            'subject_label' => $activity->subject_label,
            'subject_id' => $activity->subject_id,
            'changes_summary' => $activity->getChangesSummary(),
            'api_token_name' => $activity->api_token_name,
            'ip_address' => $activity->ip_address,
            'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
            'created_at_human' => $activity->created_at->diffForHumans(),
        ]);

        // Get filter options - filter by account
        $accountCode = $user->role === 'admin_platforme' ? null : $user->accountCode();
        $ownerId = $user->role === 'admin_platforme' ? null : $user->ownerId();

        $usersQuery = User::query();
        if ($accountCode) {
            // Exclude admin_platforme from user filters
            $usersQuery->where(function ($q) use ($ownerId) {
                $q->where('id', $ownerId)
                    ->orWhereHas('shop', fn ($sq) => $sq->where('user_id', $ownerId));
            })->where('role', '!=', 'admin_platforme');
        } else {
            // admin_platforme sees all users except other admin_platforme
            $usersQuery->where('role', '!=', 'admin_platforme');
        }
        $users = $usersQuery->get(['id', 'name', 'email']);

        $actionsQuery = ActivityLog::query()
            ->where('user_role', '!=', 'admin_platforme');
        if ($accountCode) {
            $actionsQuery->where('account_code', $accountCode);
        }
        $actions = $actionsQuery->distinct()
            ->pluck('action')
            ->map(fn($action) => [
                'value' => $action,
                'label' => ActivityLog::translateOrFallback('activity.actions.' . $action, ucfirst($action)),
            ]);

        $subjectTypesQuery = ActivityLog::whereNotNull('subject_type')
            ->where('user_role', '!=', 'admin_platforme');
        if ($accountCode) {
            $subjectTypesQuery->where('account_code', $accountCode);
        }
        $subjectTypes = $subjectTypesQuery->distinct()
            ->pluck('subject_type')
            ->map(fn($type) => [
                'value' => $type,
                'label' => ActivityLog::translateOrFallback('activity.subjects.' . $type, class_basename($type)),
            ]);

        return Inertia::render('ActivityLogs/Index', [
            'activities' => $activities,
            'filters' => $request->only(['user_id', 'action', 'subject_type', 'start_date', 'end_date', 'search']),
            'filterOptions' => [
                'users' => $users,
                'actions' => $actions,
                'subjectTypes' => $subjectTypes,
            ],
        ]);
    }

    /**
     * Display a specific activity log
     */
    public function show(ActivityLog $activityLog): Response
    {
        $user = auth()->user();

        // Check permission
        if ($user->role !== 'admin_platforme') {
            // Non admin_platforme users can only view logs from their account
            if ($activityLog->account_code !== $user->accountCode()) {
                abort(403, 'Vous n\'avez pas accès à cet historique.');
            }
        }
        // admin_platforme can view all logs

        return Inertia::render('ActivityLogs/Show', [
            'activity' => [
                'id' => $activityLog->id,
                'user' => $activityLog->user ? [
                    'id' => $activityLog->user->id,
                    'name' => $activityLog->user->name,
                    'email' => $activityLog->user->email,
                    'role' => $activityLog->user->role,
                ] : [
                    'name' => $activityLog->user_name,
                    'email' => $activityLog->user_email,
                    'role' => $activityLog->user_role,
                ],
                'shop' => $activityLog->shop ? [
                    'id' => $activityLog->shop->id,
                    'name' => $activityLog->shop->name,
                ] : [
                    'name' => $activityLog->shop_name,
                ],
                'action' => $activityLog->action,
                'action_label' => $activityLog->action_label,
                'description' => $activityLog->translated_description,
                'subject_type' => $activityLog->subject_type,
                'subject_label' => $activityLog->subject_label,
                'subject_id' => $activityLog->subject_id,
                'properties' => $activityLog->properties,
                'api_token_name' => $activityLog->api_token_name,
                'ip_address' => $activityLog->ip_address,
                'user_agent' => $activityLog->user_agent,
                'method' => $activityLog->method,
                'url' => $activityLog->url,
                'created_at' => $activityLog->created_at->format('Y-m-d H:i:s'),
                'created_at_human' => $activityLog->created_at->diffForHumans(),
            ],
        ]);
    }
}
