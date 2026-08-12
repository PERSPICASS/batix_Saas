<?php

namespace Tests\Unit;

use App\Models\MarketingCampaign;
use App\Models\MarketingLead;
use App\Services\BatixGrowthAiService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BatixGrowthAiServiceTest extends TestCase
{
    public function test_it_generates_three_structured_campaign_contents(): void
    {
        config([
            'services.openai.api_key' => 'test-key',
            'services.openai.marketing_model' => 'gpt-5-mini',
        ]);

        Http::fake([
            'api.openai.com/*' => Http::response($this->responsePayload([
                'contents' => [
                    ['format' => 'post', 'title' => 'Stock', 'hook' => 'Votre stock est-il fiable ?', 'body' => 'Texte post', 'cta' => 'Demandez une démo.'],
                    ['format' => 'reel_script', 'title' => 'Reel stock', 'hook' => 'Encore sur Excel ?', 'body' => 'Script reel', 'cta' => 'Écrivez-nous sur WhatsApp.'],
                    ['format' => 'ad', 'title' => 'Pub ventes', 'hook' => 'Gardez le contrôle.', 'body' => 'Texte publicité', 'cta' => 'Réservez une démo.'],
                ],
            ]), 200),
        ]);

        $campaign = new MarketingCampaign([
            'name' => 'Acquisition Facebook',
            'channel' => 'facebook',
            'objective' => 'Obtenir des démos',
            'audience' => 'Gérants de quincailleries',
            'offer' => 'Démonstration gratuite',
        ]);

        $contents = app(BatixGrowthAiService::class)->generateCampaignContents($campaign);

        $this->assertCount(3, $contents);
        $this->assertSame('post', $contents[0]['format']);

        Http::assertSent(function (Request $request) {
            return $request->url() === 'https://api.openai.com/v1/responses'
                && $request['model'] === 'gpt-5-mini'
                && $request['store'] === false
                && $request['text']['format']['type'] === 'json_schema';
        });
    }

    public function test_it_scores_a_lead_and_builds_a_whatsapp_message(): void
    {
        config([
            'services.openai.api_key' => 'test-key',
            'services.openai.marketing_model' => 'gpt-5-mini',
        ]);

        Http::fake([
            'api.openai.com/*' => Http::response($this->responsePayload([
                'score' => 82,
                'qualification' => 'qualified',
                'summary' => 'Le prospect gère une quincaillerie et cherche à mieux suivre son stock.',
                'next_action' => 'Proposer une démonstration de 15 minutes.',
                'whatsapp_message' => 'Bonjour, je peux vous montrer comment BatixPro centralise ventes et stock. Souhaitez-vous une courte démo ?',
            ]), 200),
        ]);

        $lead = new MarketingLead([
            'name' => 'Client Test',
            'phone' => '+2250000000000',
            'company' => 'Quincaillerie Test',
            'business_type' => 'Quincaillerie',
            'source' => 'whatsapp',
            'notes' => 'Utilise Excel et veut mieux suivre les ruptures.',
        ]);

        $result = app(BatixGrowthAiService::class)->scoreLead($lead);

        $this->assertSame(82, $result['score']);
        $this->assertSame('qualified', $result['qualification']);
        $this->assertStringContainsString('BatixPro', $result['whatsapp_message']);
    }

    private function responsePayload(array $structuredOutput): array
    {
        return [
            'id' => 'resp_test',
            'status' => 'completed',
            'output' => [
                [
                    'type' => 'message',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode($structuredOutput, JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ],
            ],
        ];
    }
}
