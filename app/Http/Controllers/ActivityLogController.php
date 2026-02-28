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
     * Display activity logs for current shop
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $shop = current_shop();

        $query = ActivityLog::query()
            ->with(['user', 'shop'])
            ->latest();

        // Filter by shop for non-super_admin users
        if ($user->role !== 'super_admin') {
            $query->where('shop_id', $shop->id);
        } else {
            // Super admin can see all activities in their shops
            $userShopIds = $user->shops->pluck('id');
            $query->whereIn('shop_id', $userShopIds);
        }

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
            'description' => $activity->description,
            'subject_type' => $activity->subject_type,
            'subject_label' => $activity->subject_label,
            'subject_id' => $activity->subject_id,
            'changes_summary' => $activity->getChangesSummary(),
            'ip_address' => $activity->ip_address,
            'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
            'created_at_human' => $activity->created_at->diffForHumans(),
        ]);

        // Get filter options
        $users = User::whereIn('id', function($query) use ($userShopIds) {
            $query->select('user_id')
                ->from('activity_logs')
                ->whereIn('shop_id', $userShopIds)
                ->whereNotNull('user_id');
        })->get(['id', 'name', 'email']);

        $actions = ActivityLog::whereIn('shop_id', $userShopIds)
            ->distinct()
            ->pluck('action')
            ->map(fn($action) => [
                'value' => $action,
                'label' => ucfirst($action)
            ]);

        $subjectTypes = ActivityLog::whereIn('shop_id', $userShopIds)
            ->whereNotNull('subject_type')
            ->distinct()
            ->pluck('subject_type')
            ->map(fn($type) => [
                'value' => $type,
                'label' => class_basename($type)
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
        if ($user->role !== 'super_admin') {
            $shop = current_shop();
            if ($activityLog->shop_id !== $shop->id) {
                abort(403);
            }
        } else {
            // Super admin can only see activities in their shops
            if (!$user->shops->pluck('id')->contains($activityLog->shop_id)) {
                abort(403);
            }
        }

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
                'description' => $activityLog->description,
                'subject_type' => $activityLog->subject_type,
                'subject_label' => $activityLog->subject_label,
                'subject_id' => $activityLog->subject_id,
                'properties' => $activityLog->properties,
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
