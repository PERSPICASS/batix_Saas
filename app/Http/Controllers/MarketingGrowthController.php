<?php

namespace App\Http\Controllers;

use App\Models\MarketingCampaign;
use App\Models\MarketingContent;
use App\Models\MarketingLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MarketingGrowthController extends Controller
{
    public function index(): Response
    {
        $userId = Auth::id();

        $campaigns = MarketingCampaign::query()
            ->where('user_id', $userId)
            ->latest()
            ->limit(8)
            ->get();

        $contents = MarketingContent::query()
            ->where('user_id', $userId)
            ->latest()
            ->limit(8)
            ->get();

        $leads = MarketingLead::query()
            ->where('user_id', $userId)
            ->latest()
            ->limit(12)
            ->get();

        return Inertia::render('Marketing/Index', [
            'campaigns' => $campaigns,
            'contents' => $contents,
            'leads' => $leads,
            'stats' => [
                'campaigns' => MarketingCampaign::where('user_id', $userId)->count(),
                'draft_contents' => MarketingContent::where('user_id', $userId)->where('status', 'draft')->count(),
                'leads' => MarketingLead::where('user_id', $userId)->count(),
                'qualified_leads' => MarketingLead::where('user_id', $userId)->whereIn('status', ['qualified', 'demo', 'won'])->count(),
            ],
        ]);
    }

    public function storeCampaign(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'channel' => 'required|in:facebook,instagram,whatsapp,tiktok,linkedin',
            'objective' => 'required|string|max:2000',
            'audience' => 'required|string|max:2000',
            'offer' => 'nullable|string|max:2000',
            'daily_budget' => 'nullable|numeric|min:0',
        ]);

        MarketingCampaign::create([
            ...$validated,
            'user_id' => Auth::id(),
            'status' => 'draft',
        ]);

        return back()->with('success', 'Campagne ajoutée à BATIX Growth.');
    }

    public function storeLead(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:40',
            'company' => 'nullable|string|max:255',
            'business_type' => 'nullable|string|max:255',
            'source' => 'required|in:facebook,instagram,whatsapp,tiktok,linkedin,manual',
            'marketing_campaign_id' => 'nullable|integer',
            'notes' => 'nullable|string|max:4000',
        ]);

        if (!empty($validated['marketing_campaign_id'])) {
            MarketingCampaign::where('user_id', Auth::id())
                ->findOrFail($validated['marketing_campaign_id']);
        }

        MarketingLead::create([
            ...$validated,
            'user_id' => Auth::id(),
            'status' => 'new',
            'score' => 0,
        ]);

        return back()->with('success', 'Prospect enregistré.');
    }
}
