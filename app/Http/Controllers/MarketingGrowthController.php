<?php

namespace App\Http\Controllers;

use App\Models\MarketingCampaign;
use App\Models\MarketingContent;
use App\Models\MarketingLead;
use App\Services\BatixGrowthAiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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
            ->limit(12)
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
            'aiConfigured' => (bool) config('services.openai.api_key'),
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

    public function generateCampaignContents(MarketingCampaign $campaign, BatixGrowthAiService $ai)
    {
        $this->ensureOwner($campaign->user_id);

        try {
            $generated = $ai->generateCampaignContents($campaign);

            foreach ($generated as $content) {
                MarketingContent::create([
                    'user_id' => Auth::id(),
                    'marketing_campaign_id' => $campaign->id,
                    'channel' => $campaign->channel,
                    'format' => $content['format'],
                    'status' => 'draft',
                    'title' => $content['title'],
                    'hook' => $content['hook'],
                    'body' => $content['body'],
                    'cta' => $content['cta'],
                    'meta' => [
                        'generated_by' => 'batix-growth-ai',
                        'generated_at' => now()->toIso8601String(),
                    ],
                ]);
            }
        } catch (Throwable $exception) {
            Log::error('BATIX Growth content generation failed', [
                'campaign_id' => $campaign->id,
                'user_id' => Auth::id(),
                'exception' => $exception,
            ]);

            return back()->with('error', 'La génération IA a échoué. Vérifiez la clé OpenAI et les logs serveur.');
        }

        return back()->with('success', '3 contenus ont été générés en brouillon pour validation.');
    }

    public function scoreLead(MarketingLead $lead, BatixGrowthAiService $ai)
    {
        $this->ensureOwner($lead->user_id);

        try {
            $result = $ai->scoreLead($lead);

            $nextStatus = match ($result['qualification']) {
                'qualified' => 'qualified',
                'warm' => 'contacted',
                default => 'new',
            };

            if (in_array($lead->status, ['demo', 'won'], true)) {
                $nextStatus = $lead->status;
            }

            $lead->update([
                'score' => $result['score'],
                'status' => $nextStatus,
                'ai_summary' => $result['summary'],
                'ai_next_action' => $result['next_action'],
                'whatsapp_script' => $result['whatsapp_message'],
                'scored_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::error('BATIX Growth lead scoring failed', [
                'lead_id' => $lead->id,
                'user_id' => Auth::id(),
                'exception' => $exception,
            ]);

            return back()->with('error', 'La qualification IA a échoué. Vérifiez la clé OpenAI et les logs serveur.');
        }

        return back()->with('success', 'Prospect qualifié et message WhatsApp préparé.');
    }

    private function ensureOwner(int $userId): void
    {
        abort_unless($userId === Auth::id(), 403);
    }
}
