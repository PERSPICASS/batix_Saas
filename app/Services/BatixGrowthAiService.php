<?php

namespace App\Services;

use App\Models\MarketingCampaign;
use App\Models\MarketingLead;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class BatixGrowthAiService
{
    public function generateCampaignContents(MarketingCampaign $campaign): array
    {
        $schema = [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'contents' => [
                    'type' => 'array',
                    'minItems' => 3,
                    'maxItems' => 3,
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'properties' => [
                            'format' => ['type' => 'string', 'enum' => ['post', 'reel_script', 'ad']],
                            'title' => ['type' => 'string'],
                            'hook' => ['type' => 'string'],
                            'body' => ['type' => 'string'],
                            'cta' => ['type' => 'string'],
                        ],
                        'required' => ['format', 'title', 'hook', 'body', 'cta'],
                    ],
                ],
            ],
            'required' => ['contents'],
        ];

        $data = $this->structuredResponse(
            'batix_growth_campaign_content',
            $schema,
            implode("\n", [
                'Tu es BATIX Growth, le responsable acquisition de BatixPro.',
                'BatixPro est un SaaS de gestion pour commerces et quincailleries : ventes, stocks, clients, fournisseurs, factures, inventaires, boutiques et utilisateurs.',
                'Objectif : obtenir des conversations WhatsApp qualifiées puis des démonstrations.',
                'Écris en français naturel, professionnel et direct, adapté au marché ouest-africain sans caricature.',
                'Ne promets jamais des résultats non vérifiés et n’invente aucun témoignage.',
                'Chaque contenu doit se concentrer sur un problème concret du gérant et terminer par un CTA vers une démonstration WhatsApp.',
                '',
                "Canal : {$campaign->channel}",
                "Nom de campagne : {$campaign->name}",
                "Objectif : {$campaign->objective}",
                "Audience : {$campaign->audience}",
                'Offre : '.($campaign->offer ?: 'Démonstration gratuite de BatixPro.'),
                '',
                'Génère exactement 3 variantes complémentaires : un post, un script Reel et une publicité.',
            ]),
        );

        return $data['contents'];
    }

    public function scoreLead(MarketingLead $lead): array
    {
        $schema = [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'score' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                'qualification' => ['type' => 'string', 'enum' => ['cold', 'warm', 'qualified']],
                'summary' => ['type' => 'string'],
                'next_action' => ['type' => 'string'],
                'whatsapp_message' => ['type' => 'string'],
            ],
            'required' => ['score', 'qualification', 'summary', 'next_action', 'whatsapp_message'],
        ];

        return $this->structuredResponse(
            'batix_growth_lead_score',
            $schema,
            implode("\n", [
                'Tu es BATIX Growth, assistant commercial de BatixPro.',
                'Évalue ce prospect uniquement à partir des informations disponibles. Ne déduis pas de données sensibles et n’invente rien.',
                'Le score doit refléter la probabilité qu’une démonstration BatixPro soit pertinente maintenant.',
                'Un commerce, une quincaillerie, un grossiste ou distributeur avec un problème de ventes/stock/facturation est prioritaire.',
                'Le message WhatsApp doit être court, humain, non insistant, et inviter à une démonstration ou à préciser le besoin.',
                '',
                "Nom : {$lead->name}",
                'Entreprise : '.($lead->company ?: 'non renseignée'),
                'Activité : '.($lead->business_type ?: 'non renseignée'),
                "Source : {$lead->source}",
                'Notes : '.($lead->notes ?: 'aucune'),
            ]),
        );
    }

    private function structuredResponse(string $schemaName, array $schema, string $input): array
    {
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            throw new RuntimeException('OPENAI_API_KEY n’est pas configurée sur le serveur.');
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(60)
            ->retry(2, 500)
            ->post('https://api.openai.com/v1/responses', [
                'model' => config('services.openai.marketing_model', 'gpt-5-mini'),
                'store' => false,
                'input' => $input,
                'text' => [
                    'format' => [
                        'type' => 'json_schema',
                        'name' => $schemaName,
                        'schema' => $schema,
                        'strict' => true,
                    ],
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('OpenAI API: '.$response->status().' '.$response->body());
        }

        $text = $this->extractOutputText($response->json());
        $decoded = json_decode($text, true);

        if (!is_array($decoded)) {
            throw new RuntimeException('Réponse IA invalide ou non structurée.');
        }

        return $decoded;
    }

    private function extractOutputText(array $payload): string
    {
        foreach ($payload['output'] ?? [] as $item) {
            if (($item['type'] ?? null) !== 'message') {
                continue;
            }

            foreach ($item['content'] ?? [] as $content) {
                if (($content['type'] ?? null) === 'output_text' && isset($content['text'])) {
                    return $content['text'];
                }
            }
        }

        throw new RuntimeException('Aucun texte exploitable dans la réponse IA.');
    }
}
