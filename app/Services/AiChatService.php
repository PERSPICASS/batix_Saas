<?php

namespace App\Services;

use Anthropic\Client;
use App\Services\Mcp\McpClient;

/**
 * Assistant IA interne. Ne définit ni n'exécute plus aucun tool localement : il agit
 * comme un client MCP et délègue toutes ses lectures métier à la passerelle BATIXPRO
 * (App\Services\Mcp\McpClient). La liste des tools est découverte dynamiquement via
 * `tools/list`, et leur exécution passe par `tools/call`. Une source unique de tools
 * et de sécurité, partagée avec les assistants externes.
 */
class AiChatService
{
    /**
     * Outils qui écrivent. Une seule liste, consommée à deux endroits : le décompte des
     * écritures tentées (pour dire la vérité quand un tour est interrompu) et la
     * relecture de contrôle. Deux listes auraient fini par diverger, et un outil oublié
     * dans l'une passerait sans vérification.
     */
    private const WRITE_TOOLS = ['quote_create', 'quote_update', 'invoice_create', 'invoice_update'];

    private static Client $client;

    private static function client(): Client
    {
        return self::$client ??= new Client(
            apiKey: config('services.anthropic.key')
        );
    }

    public static function chat(string $message, array $history, array $shopIds, object $user, string $shopName): string
    {
        // Token Sanctum éphémère : porte exactement les abilities de lecture dont le
        // MCP a besoin, révoqué en fin de requête (voir finally). Le MCP le transfère
        // verbatim à l'API v1, qui applique le scoping tenant.
        $token = $user->createToken(
            'ai-chat-mcp',
            [
                'products:read', 'customers:read', 'sales:read', 'stock-movements:read',
                'quotes:read', 'invoices:read',
                // Écritures limitées au brouillon par les contrôleurs v1 eux-mêmes :
                // l'ability ouvre la création, pas l'émission du document.
                'quotes:write', 'invoices:write',
            ],
            now()->addMinutes(10),
        );

        try {
            $mcp = new McpClient(config('services.batixpro_mcp.url'), $token->plainTextToken);
            $mcp->initialize();
            $tools = $mcp->listTools();

            return self::runConversation($message, $history, $shopIds, $user, $shopName, $mcp, $tools);
        } finally {
            $token->accessToken->delete();
        }
    }

    /**
     * @param  array<int, array>  $tools  Définitions de tools au format Anthropic (via MCP).
     * @param  array<int>  $shopIds
     */
    private static function runConversation(
        string $message,
        array $history,
        array $shopIds,
        object $user,
        string $shopName,
        McpClient $mcp,
        array $tools,
    ): string {
        $messages = self::buildMessages($history, $message);

        // L'identifiant est donné explicitement : sans lui, le modèle le déduisait du NOM
        // de la boutique — « Quincaillerie Générale 2 » lui faisait croire à un shop_id 2 —
        // puis criait au conflit en voyant le shop_id réel dans les résultats, et refusait
        // de créer le devis. Un chiffre dans un nom n'est pas un identifiant.
        $systemPrompt = "Tu es un assistant IA expert en gestion de commerce pour BATIX PRO.
                    - La boutique actuelle est: « $shopName », dont l'identifiant est shop_id={$shopIds[0]}
                    - La date actuelle est: " . date('Y-m-d H:i:s') . "
                    - Le rôle de l'utilisateur est: {$user->role}

                    Le paramètre shop_id est imposé par l'application à chaque appel d'outil :
                    tu n'as ni à le fournir, ni à t'en inquiéter. Tout ce que les outils te
                    renvoient appartient donc déjà à la boutique courante. Ne conclus JAMAIS à
                    un conflit de boutique à partir d'un nom : le chiffre qu'un nom contient
                    n'est pas un identifiant.

                    Réponds TOUJOURS en français.
                    Utilise les outils pour récupérer les données métier fraîches plutôt que de répondre de mémoire.
                    Fournis des réponses concises et actionnables.

                    Le fil de discussion affiche du texte brut : les retours à la ligne sont respectés,
                    mais la syntaxe Markdown ne l'est pas. N'écris donc jamais **gras**, # titres ou
                    tableaux (les caractères s'afficheraient tels quels). Pour une énumération, mets
                    un élément par ligne, préfixé d'un tiret ou d'un emoji.

                    Tes capacités se limitent STRICTEMENT aux outils dont tu disposes. N'annonce
                    jamais une capacité qu'ils ne couvrent pas : tu ne peux ni modifier, ni
                    supprimer, ni enregistrer une vente. Si on te le demande, dis-le franchement
                    et oriente vers le module concerné de l'application.

                    Quatre outils écrivent : créer et modifier un devis, créer et modifier une
                    facture. Ils ne touchent QUE des BROUILLONS — un document envoyé, payé,
                    accepté ou annulé n'est plus modifiable, et le serveur refusera. C'est la
                    règle de l'application, pas une limite qu'on peut contourner : si un refus
                    arrive, explique-le et propose de créer un nouveau document.

                    Pour modifier, les lignes envoyées REMPLACENT les précédentes. Relis donc
                    toujours le document avant de le modifier, puis renvoie la liste COMPLÈTE
                    des lignes : ce que tu ne répètes pas est effacé. « Ajoute tel produit au
                    devis » signifie donc : retrouver le devis, lire ses lignes, y ajouter la
                    nouvelle, tout renvoyer.

                    RÈGLE ABSOLUE — n'annonce JAMAIS qu'un document a été créé ou modifié si tu
                    n'as pas reçu, DANS CE TOUR, la réponse de l'outil correspondant. Tant que
                    tu n'as pas appelé l'outil, décris ce que tu VAS faire, jamais ce que tu
                    aurais fait. Quand l'utilisateur confirme, ta première action est l'appel de
                    l'outil, pas une réponse.

                    Après chaque écriture, le serveur relit le document et joint son état réel
                    sous la clé « relecture ». C'est CETTE clé qui fait foi : montants, quantités,
                    lignes, numéro et lien s'y recopient, jamais depuis un message antérieur.
                    Si « relecture » ne contient pas ce que tu attendais — une ligne absente, un
                    total inchangé —, dis-le franchement au lieu d'annoncer un succès.

                    N'INVENTE JAMAIS un identifiant de document. Si tu n'as plus l'identifiant
                    d'un devis ou d'une facture, retrouve-le avec l'outil de recherche
                    correspondant, en cherchant son NUMÉRO (celui que tu as annoncé, par exemple
                    QTE-202608-001) ou le nom du client. Un identifiant deviné tombe sur un autre
                    document ou sur rien.

                    Avant d'appeler l'un de ces outils :
                    - récapitule au client ce que tu vas créer (client, lignes, quantités, prix)
                      et attends une confirmation explicite dans le message suivant ;
                    - ne devine jamais un prix ni une référence : retrouve-les avec les outils de
                      recherche produit, et le client avec la recherche client.
                    Après création, donne le numéro du document, PUIS le lien `web_url` renvoyé
                    par l'outil, collé tel quel sur sa propre ligne — il devient cliquable dans
                    le fil. Ne fabrique jamais une URL toi-même et n'en devine aucune : s'il n'y
                    a pas de `web_url` dans la réponse, ne mets pas de lien. Rappelle enfin que
                    le document est en brouillon et qu'il reste à valider dans l'application.
                    Le même `web_url` accompagne les devis et factures que tu consultes : cite-le
                    quand tu en présentes un, pour que l'utilisateur puisse l'ouvrir.";

        $response = self::client()->messages->create(
            model: 'claude-haiku-4-5',
            maxTokens: 1024,
            system: $systemPrompt,
            tools: $tools,
            messages: $messages,
        );

        // Cap tool round-trips: an unbounded loop would let a single HTTP request trigger
        // unlimited Anthropic API calls (each resending the growing message history),
        // making one request arbitrarily expensive regardless of the per-minute throttle.
        //
        // Relevé de 5 à 8 : un simple « ajoute ce produit au devis » en consomme déjà
        // quatre (relire le document, chercher le produit, écrire, corriger un refus de
        // validation et réécrire). À 5, la moindre reprise faisait tomber la boucle en
        // plein milieu — c'est ce qui rendait la modification intermittente.
        $maxToolRounds = 8;
        $toolRounds = 0;
        $writeAttempts = 0;

        // Le plafond de tours borne le NOMBRE d'opérations, pas leur durée : cinq tours
        // à 20 s d'appel MCP dépassent largement les 30 s de max_execution_time. PHP tue
        // alors la requête par une erreur fatale, que le contrôleur ne peut pas
        // rattraper : l'utilisateur reçoit un 500 nu au lieu d'une explication. Le budget
        // rend cette limite atteignable avant celle de PHP.
        $deadline = microtime(true) + self::timeBudgetSeconds();
        $timedOut = false;

        while ($response->stopReason === 'tool_use' && $toolRounds < $maxToolRounds) {
            if (microtime(true) >= $deadline) {
                $timedOut = true;
                break;
            }

            $toolRounds++;

            // TOUS les blocs tool_use du tour, pas seulement le premier. Le modèle appelle
            // volontiers plusieurs outils en parallèle — « un devis pour X avec 30 Y »
            // demande de chercher le client ET le produit — et l'API exige alors un
            // tool_result par tool_use dans le message suivant. N'en traiter qu'un tout en
            // réinjectant $response->content entier faisait rejeter la conversation avec
            // « tool_use ids were found without tool_result blocks ».
            $toolUseBlocks = collect($response->content)->where('type', 'tool_use')->values();

            if ($toolUseBlocks->isEmpty()) {
                break;
            }

            $writeAttempts += $toolUseBlocks
                ->filter(fn ($block) => in_array($block->name, self::WRITE_TOOLS, true))
                ->count();

            $messages[] = [
                'role' => 'assistant',
                'content' => $response->content,
            ];

            $messages[] = [
                'role' => 'user',
                'content' => self::executeToolCalls($toolUseBlocks, $mcp, $shopIds[0], $deadline),
            ];

            // Relu APRÈS les outils : un seul tour peut avoir consommé tout le budget.
            // On s'arrête avant de payer un aller-retour Anthropic qu'on n'a plus le
            // temps d'exploiter — et, si executeToolCalls s'est interrompu faute de
            // temps, avant d'envoyer un tour aux tool_result incomplets.
            if (microtime(true) >= $deadline) {
                $timedOut = true;
                break;
            }

            $response = self::client()->messages->create(
                model: 'claude-haiku-4-5',
                maxTokens: 1024,
                system: $systemPrompt,
                tools: $tools,
                messages: $messages,
            );
        }

        if ($timedOut) {
            return self::unfinishedMessage(
                "Votre demande a nécessité trop de recherches pour aboutir dans le temps imparti.",
                $writeAttempts,
            );
        }

        // La boucle s'est arrêtée alors que le modèle voulait ENCORE appeler des outils :
        // le texte de cette réponse-là n'est qu'un préambule (« je vais maintenant modifier
        // la facture… »), jamais un compte rendu. Le renvoyer tel quel présentait une
        // intention comme un fait accompli — c'est ainsi qu'une facture était annoncée
        // modifiée sans l'être.
        if ($response->stopReason === 'tool_use') {
            return self::unfinishedMessage(
                "Je n'ai pas pu terminer cette demande : elle a demandé trop d'étapes successives.",
                $writeAttempts,
            );
        }

        $textBlock = collect($response->content)->firstWhere('type', 'text');
        return $textBlock?->text ?? 'Je n\'ai pas pu générer une réponse.';
    }

    /**
     * Message d'un tour interrompu, qui dit franchement où en est le document.
     *
     * Le point délicat est le sort des écritures : quelques-unes ont pu aboutir avant
     * l'interruption. Annoncer « rien n'a été enregistré » serait faux et enverrait
     * l'utilisateur recommencer par-dessus une modification déjà passée.
     */
    private static function unfinishedMessage(string $cause, int $writeAttempts): string
    {
        if ($writeAttempts > 0) {
            return $cause . "\n"
                . "Attention : j'avais commencé à enregistrer des modifications. Ouvrez le document "
                . "dans l'application pour voir son état réel avant de relancer la demande — je ne "
                . 'peux pas vous le confirmer d\'ici.';
        }

        return $cause . "\n"
            . "Aucune modification n'a été enregistrée. Reformulez de façon plus ciblée — une seule "
            . 'opération à la fois — ou réessayez dans un instant.';
    }

    /**
     * Temps total alloué à la boucle d'outils, déduit de la limite de PHP.
     *
     * Calculé plutôt que codé en dur : `max_execution_time` vaut 30 s sous le serveur de
     * développement mais peut différer en production (php-fpm), et un budget supérieur à
     * la limite ne protégerait de rien. La marge laisse de quoi formuler puis sérialiser
     * la réponse une fois la boucle terminée.
     */
    private static function timeBudgetSeconds(): int
    {
        $limit = (int) ini_get('max_execution_time');

        // 0 = illimité (CLI, file d'attente). On borne quand même : une requête HTTP qui
        // traîne indéfiniment immobilise un worker et l'utilisateur attend sans réponse.
        if ($limit <= 0) {
            return 55;
        }

        return max(5, $limit - 5);
    }

    /**
     * Exécute chaque bloc `tool_use` d'un tour et renvoie les `tool_result` correspondants.
     *
     * L'invariant tenu ici est celui que réclame l'API Anthropic : le message qui suit une
     * réponse contenant des `tool_use` doit porter UN `tool_result` par bloc, référencé par
     * son `tool_use_id`. Il en manque un seul et toute la conversation est rejetée.
     *
     * @param  iterable<object>  $toolUseBlocks
     * @param  float  $deadline  Instant (microtime) au-delà duquel on cesse d'appeler.
     * @return array<int, array{type: string, tool_use_id: string, content: mixed}>
     */
    private static function executeToolCalls(
        iterable $toolUseBlocks,
        McpClient $mcp,
        int $shopId,
        float $deadline,
    ): array {
        $toolResults = [];

        foreach ($toolUseBlocks as $block) {
            $remaining = $deadline - microtime(true);

            // Budget épuisé : on cesse d'appeler, quitte à renvoyer moins de tool_result
            // que de tool_use. L'invariant ne vaut que pour les requêtes réellement
            // envoyées, or runConversation relit l'horloge juste après et abandonne le
            // tour sans jamais transmettre ces messages à l'API.
            if ($remaining <= 0) {
                break;
            }

            // Chaque appel est plafonné au temps restant : sinon deux outils enchaînés
            // à 20 s dépasseraient le budget de l'intérieur, sans que la boucle ne
            // reprenne jamais la main pour s'en apercevoir.
            $mcp->limitTimeoutTo((int) ceil($remaining));

            // On force la boutique sélectionnée : l'assistant reste cantonné à la
            // boutique courante (les tools ignorant shop_id le laissent simplement tomber).
            $arguments = (array) $block->input;
            $arguments['shop_id'] = $shopId;

            $written = $mcp->callTool($block->name, $arguments);

            $toolResults[] = [
                'type' => 'tool_result',
                'tool_use_id' => $block->id,
                'content' => self::withVerification($block->name, $written, $mcp, $shopId, $deadline),
            ];
        }

        return $toolResults;
    }

    /**
     * Après une écriture, relit le document et joint son état réel au résultat.
     *
     * Le modèle a annoncé « facture modifiée avec succès » sans avoir appelé le moindre
     * outil, en recopiant les montants d'une réponse précédente — sur une pièce
     * comptable. Une consigne dans le prompt ne suffit pas : elle demande au modèle de
     * se surveiller lui-même. Ici, c'est le serveur qui va rechercher l'état réel en
     * base, et le pose dans le contexte à côté de ce que l'écriture a renvoyé.
     *
     * La relecture n'est pas une politesse : elle passe par un autre endpoint que
     * l'écriture, donc elle confirme que la modification a bien été PERSISTÉE, et pas
     * seulement acceptée. Si les deux divergent, le modèle a sous les yeux de quoi le
     * dire au lieu d'affirmer un succès.
     */
    private static function withVerification(
        string $toolName,
        string $writeResult,
        McpClient $mcp,
        int $shopId,
        float $deadline,
    ): string {
        if (! in_array($toolName, self::WRITE_TOOLS, true)) {
            return $writeResult;
        }

        // « quote_update » -> outil « quote_get », paramètre « quote_id ».
        $domain = explode('_', $toolName)[0];
        $readTool = "{$domain}_get";
        $idParameter = "{$domain}_id";

        $decoded = json_decode($writeResult, true);
        $documentId = $decoded['data']['id'] ?? null;

        // Écriture en échec (erreur, validation refusée) : rien à relire, et le message
        // d'erreur doit remonter intact au modèle.
        if (! is_int($documentId)) {
            return $writeResult;
        }

        $remaining = $deadline - microtime(true);
        if ($remaining <= 0) {
            return $writeResult;
        }

        $mcp->limitTimeoutTo((int) ceil($remaining));

        try {
            $verified = $mcp->callTool($readTool, [$idParameter => $documentId, 'shop_id' => $shopId]);
        } catch (\Throwable $e) {
            // La relecture échoue : on ne perd pas l'écriture pour autant, mais on dit au
            // modèle qu'elle n'est pas confirmée plutôt que de le laisser croire qu'elle l'est.
            return json_encode([
                'ecriture' => $decoded,
                'relecture' => null,
                'avertissement' => 'La relecture de contrôle a échoué : annonce que le document a été '
                    . 'enregistré mais que son contenu n\'a pas pu être revérifié, et invite à ouvrir le lien.',
            ], JSON_UNESCAPED_UNICODE);
        }

        return json_encode([
            'ecriture' => $decoded,
            'relecture' => json_decode($verified, true),
            'consigne' => 'ÉTAT RÉEL EN BASE : « relecture » fait foi. Tous les montants, quantités, '
                . 'lignes, numéro et lien que tu annonces se recopient depuis « relecture », jamais '
                . 'depuis un message antérieur. Si « relecture » ne contient pas ce que tu attendais, '
                . 'dis-le au lieu d\'annoncer un succès.',
        ], JSON_UNESCAPED_UNICODE);
    }

    private static function buildMessages(array $history, string $message): array
    {
        $messages = [];

        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg['role'] ?? 'user',
                'content' => $msg['content'] ?? '',
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $message,
        ];

        return $messages;
    }
}
