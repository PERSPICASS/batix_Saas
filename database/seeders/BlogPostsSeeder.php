<?php

namespace Database\Seeders;

use App\Models\Post;
use Illuminate\Database\Seeder;

class BlogPostsSeeder extends Seeder
{
    public function run(): void
    {
        $posts = [

            // ── Article 1 ──────────────────────────────────────────────────────
            [
                'slug'       => 'gestion-stock-quincaillerie',
                'title_fr'   => 'Comment gérer le stock d\'une quincaillerie sans se perdre',
                'title_en'   => 'How to Manage Hardware Store Inventory Without Losing Control',
                'excerpt_fr' => 'Un stock mal géré, c\'est de l\'argent immobilisé, des ruptures au mauvais moment et des clients insatisfaits. Voici une méthode concrète pour reprendre le contrôle.',
                'excerpt_en' => 'Poor inventory management means locked-up capital, untimely stockouts, and dissatisfied customers. Here is a concrete method to regain control.',
                'content_fr' => <<<'HTML'
<p>Dans une quincaillerie, le stock est le cœur de l'activité. Des milliers de références, des produits de toutes tailles, des fournisseurs différents — et pourtant, beaucoup de gérants avouent ne pas savoir exactement ce qu'ils ont en rayon à un instant donné. Ce flou coûte cher.</p>

<h2>Pourquoi la gestion de stock est critique en quincaillerie</h2>
<p>Contrairement à d'autres commerces, une quincaillerie peut avoir 2 000 à 10 000 références actives. Un boulon manquant peut faire perdre une vente, mais un surstockage de produits à faible rotation immobilise du capital pendant des mois. L'équilibre est difficile à trouver sans outils.</p>
<ul>
  <li><strong>Ruptures de stock non détectées</strong> : le vendeur découvre qu'un produit est épuisé au moment où le client le demande.</li>
  <li><strong>Inventaires approximatifs</strong> : les quantités dans le cahier ne correspondent plus à la réalité physique.</li>
  <li><strong>Vol et casse non comptabilisés</strong> : les pertes s'accumulent sans être identifiées.</li>
  <li><strong>Commandes fournisseurs mal calibrées</strong> : on commande trop ou pas assez, faute de données fiables.</li>
</ul>

<h2>Mettre en place une organisation par famille de produits</h2>
<p>La première étape est de <strong>catégoriser vos références</strong> de façon cohérente : visserie, plomberie, électricité, peinture, outillage, etc. Cette classification vous permet de faire des inventaires tournants par section plutôt qu'un grand inventaire annuel paralysant.</p>
<ul>
  <li>Un emplacement fixe dans le dépôt ou en rayon</li>
  <li>Un stock minimum défini (seuil d'alerte)</li>
  <li>Un fournisseur principal et un fournisseur de secours</li>
</ul>

<h2>Définir des seuils d'alerte pour chaque produit</h2>
<p>Un seuil d'alerte, c'est le niveau de stock en dessous duquel vous devez impérativement commander. Pour le définir, posez-vous ces questions :</p>
<ul>
  <li>Quel est le délai de livraison de mon fournisseur ?</li>
  <li>Combien d'unités je vends en moyenne par semaine ?</li>
  <li>Y a-t-il des périodes de forte demande à anticiper ?</li>
</ul>
<p>Par exemple, si vous vendez en moyenne 20 kg de ciment par jour et que votre fournisseur livre en 3 jours, votre seuil d'alerte devrait être d'au moins 60 kg de marge de sécurité.</p>

<h2>Faire des inventaires tournants plutôt qu'un grand inventaire annuel</h2>
<p>L'inventaire annuel est une opération lourde qui perturbe l'activité et démotive les équipes. Une meilleure pratique est l'<strong>inventaire tournant</strong> : chaque semaine, on inventorie une famille de produits différente. En 2 mois, tout le stock a été vérifié — et on repart pour un tour.</p>
<ul>
  <li>Détecter les écarts rapidement avant qu'ils ne s'accumulent</li>
  <li>Identifier les zones à risque (produits facilement détournés)</li>
  <li>Garder les données de stock fiables en permanence</li>
</ul>

<h2>Utiliser un logiciel adapté à la quincaillerie</h2>
<p>Un cahier ou un tableau Excel atteint très vite ses limites dès que la boutique grandit. Un logiciel de gestion comme <strong>BATIX PRO</strong> vous permet de :</p>
<ul>
  <li>Mettre à jour le stock automatiquement à chaque vente</li>
  <li>Recevoir une alerte quand un produit passe sous son seuil minimum</li>
  <li>Enregistrer les entrées de stock lors des réceptions fournisseurs</li>
  <li>Générer un rapport d'inventaire en quelques clics</li>
  <li>Gérer plusieurs dépôts ou boutiques depuis un seul tableau de bord</li>
</ul>

<h2>Conclusion</h2>
<p>La gestion de stock en quincaillerie n'est pas une science exacte, mais elle devient beaucoup plus simple avec une bonne organisation et les bons outils. Commencez par catégoriser vos produits, définissez vos seuils d'alerte, et passez à un suivi numérique. Votre trésorerie et vos clients vous remercieront.</p>
HTML,
                'content_en' => <<<'HTML'
<p>In a hardware store, inventory is the heart of the business. Thousands of references, products of all sizes, different suppliers — yet many managers admit they don't know exactly what they have on the shelves at any given moment. That uncertainty is costly.</p>

<h2>Why Inventory Management Is Critical in Hardware Stores</h2>
<p>Unlike other retail businesses, a hardware store can carry 2,000 to 10,000 active references. A missing bolt can cost a sale, while overstocking slow-moving products ties up capital for months. Finding the right balance is difficult without proper tools.</p>
<ul>
  <li><strong>Undetected stockouts</strong>: the seller discovers a product is out of stock only when the customer asks for it.</li>
  <li><strong>Approximate inventories</strong>: quantities in the logbook no longer match physical reality.</li>
  <li><strong>Unaccounted theft and breakage</strong>: losses accumulate without being identified.</li>
  <li><strong>Poorly calibrated supplier orders</strong>: ordering too much or too little due to unreliable data.</li>
</ul>

<h2>Organize by Product Family</h2>
<p>The first step is to <strong>categorize your references</strong> consistently: hardware, plumbing, electrical, paint, tools, etc. This classification allows you to do rotating cycle counts by section rather than a paralysing annual full inventory.</p>
<ul>
  <li>A fixed location in the warehouse or on the shelf</li>
  <li>A defined minimum stock level (alert threshold)</li>
  <li>A primary supplier and a backup supplier</li>
</ul>

<h2>Set Alert Thresholds for Each Product</h2>
<p>An alert threshold is the stock level below which you must reorder. To set it, ask yourself:</p>
<ul>
  <li>What is my supplier's lead time?</li>
  <li>How many units do I sell on average per week?</li>
  <li>Are there peak demand periods to anticipate?</li>
</ul>
<p>For example, if you sell an average of 20 kg of cement per day and your supplier delivers in 3 days, your safety stock threshold should be at least 60 kg.</p>

<h2>Do Cycle Counts Instead of One Big Annual Inventory</h2>
<p>The annual inventory is a heavy operation that disrupts business and demoralises teams. A better practice is <strong>cycle counting</strong>: each week, inventory a different product family. In 2 months, the entire stock has been checked — then you start over.</p>
<ul>
  <li>Detect discrepancies quickly before they compound</li>
  <li>Identify risk areas (easily pilfered products)</li>
  <li>Keep stock data reliable at all times</li>
</ul>

<h2>Use Software Designed for Hardware Stores</h2>
<p>A notebook or Excel spreadsheet quickly reaches its limits as the business grows. A management software like <strong>BATIX PRO</strong> lets you:</p>
<ul>
  <li>Automatically update stock with every sale</li>
  <li>Receive an alert when a product falls below its minimum threshold</li>
  <li>Record stock entries when receiving supplier deliveries</li>
  <li>Generate an inventory report in a few clicks</li>
  <li>Manage multiple warehouses or stores from a single dashboard</li>
</ul>

<h2>Conclusion</h2>
<p>Inventory management in a hardware store is not an exact science, but it becomes much simpler with good organisation and the right tools. Start by categorising your products, set your alert thresholds, and move to digital tracking. Your cash flow and your customers will thank you.</p>
HTML,
                'cover_image'  => 'blog/gestion-stock-quincaillerie.jpg',
                'category'     => 'Gestion',
                'author_name'  => 'BATIX PRO',
                'is_published' => true,
                'published_at' => now()->subDays(30),
            ],

            // ── Article 2 ──────────────────────────────────────────────────────
            [
                'slug'       => 'erreurs-gestion-quincaillerie',
                'title_fr'   => 'Top 5 erreurs de gestion en quincaillerie (et comment les éviter)',
                'title_en'   => 'Top 5 Hardware Store Management Mistakes (and How to Avoid Them)',
                'excerpt_fr' => 'Beaucoup de quincailleries perdent de l\'argent non pas par manque de clients, mais à cause d\'erreurs de gestion répétées. Voici les 5 pièges les plus courants.',
                'excerpt_en' => 'Many hardware stores lose money not from a lack of customers, but from repeated management mistakes. Here are the 5 most common traps.',
                'content_fr' => <<<'HTML'
<p>Après avoir accompagné de nombreuses quincailleries dans leur transformation digitale, nous avons observé les mêmes erreurs revenir encore et encore. Certaines semblent anodines, mais elles peuvent coûter des millions de FCFA sur une année. Voici les 5 plus courantes — et surtout comment les corriger.</p>

<h2>Erreur n°1 : Ne pas suivre ses marges par produit</h2>
<p>Beaucoup de gérants connaissent leur chiffre d'affaires global, mais peu savent quels produits leur rapportent vraiment de l'argent. Vendre 100 000 FCFA de marchandise ne veut rien dire si la marge nette est de 2 %.</p>
<p><strong>La solution :</strong> Enregistrez vos prix d'achat fournisseur dans votre logiciel de gestion. Vous pourrez alors voir en temps réel votre marge sur chaque vente et identifier les produits "poids morts" que vous vendez presque à perte.</p>

<h2>Erreur n°2 : Faire confiance à la mémoire plutôt qu'aux données</h2>
<p>"Je sais à peu près ce que j'ai en stock" — cette phrase est le premier signe d'une gestion approximative. La mémoire trahit, surtout quand on gère des milliers de références.</p>
<p><strong>La solution :</strong> Toute entrée et sortie de marchandise doit être enregistrée numériquement, immédiatement. Un logiciel mis à jour en temps réel vous donne une photographie exacte de votre stock à n'importe quel moment.</p>

<h2>Erreur n°3 : Ne pas former les vendeurs aux outils de caisse</h2>
<p>Un logiciel de caisse n'est utile que si tout le monde l'utilise correctement. Un vendeur qui contourne le système crée des écarts qui faussent toutes les statistiques.</p>
<p><strong>La solution :</strong> Investissez dans la formation initiale. Prévoyez 2 à 3 heures pour que chaque vendeur comprenne pourquoi les procédures existent. Les erreurs diminuent drastiquement quand les équipes comprennent l'enjeu.</p>

<h2>Erreur n°4 : Mélanger la trésorerie de la boutique et les finances personnelles</h2>
<p>Cette erreur est extrêmement fréquente dans les entreprises familiales. Résultat : impossible de savoir si la boutique est vraiment rentable.</p>
<p><strong>La solution :</strong> Définissez-vous un salaire fixe. Toute dépense personnelle et tout retrait doivent être enregistrés. La séparation des finances change radicalement la lisibilité de l'activité.</p>

<h2>Erreur n°5 : Ignorer les alertes de stock bas</h2>
<p>Les logiciels modernes envoient des alertes quand un produit passe sous son seuil minimum. Trop de gérants voient ces alertes s'accumuler sans agir.</p>
<p><strong>La solution :</strong> Traitez les alertes de stock comme des urgences commerciales. Chaque matin, un responsable passe en revue les alertes et déclenche les commandes nécessaires. Ce rituel prend 5 minutes et peut sauver des ventes importantes.</p>

<h2>Conclusion</h2>
<p>Ces cinq erreurs partagent un point commun : elles viennent toutes d'un manque d'information fiable en temps réel. Les bons outils ne remplacent pas le bon management, mais ils le rendent possible.</p>
HTML,
                'content_en' => <<<'HTML'
<p>After supporting many hardware stores through their digital transformation, we have seen the same mistakes come up again and again. Some seem minor, but they can cost millions in lost revenue over a year. Here are the 5 most common ones — and how to fix them.</p>

<h2>Mistake #1: Not Tracking Margins by Product</h2>
<p>Many managers know their overall revenue, but few know which products actually make them money. Selling a large volume of merchandise means nothing if the net margin is 2%.</p>
<p><strong>The fix:</strong> Record your supplier purchase prices in your management software. You can then see your margin on each sale in real time and identify "dead weight" products you're selling at near-zero profit.</p>

<h2>Mistake #2: Trusting Memory Over Data</h2>
<p>"I roughly know what I have in stock" — that phrase is the first sign of approximate management. Memory fails, especially when managing thousands of references.</p>
<p><strong>The fix:</strong> Every stock movement must be recorded digitally, immediately. Software updated in real time gives you an exact snapshot of your inventory at any moment.</p>

<h2>Mistake #3: Not Training Staff on the POS System</h2>
<p>A POS system is only useful if everyone uses it correctly. A seller who bypasses the system creates discrepancies that skew all your statistics.</p>
<p><strong>The fix:</strong> Invest in initial training. Set aside 2 to 3 hours so each seller understands why procedures exist. Errors drop dramatically when teams understand what's at stake.</p>

<h2>Mistake #4: Mixing Business and Personal Finances</h2>
<p>This mistake is extremely common in family businesses. The result: it's impossible to know if the store is truly profitable.</p>
<p><strong>The fix:</strong> Pay yourself a fixed salary. Every personal expense and withdrawal must be recorded. Separating finances — even informally — radically changes how clearly you can read your business performance.</p>

<h2>Mistake #5: Ignoring Low Stock Alerts</h2>
<p>Modern software sends alerts when a product falls below its minimum threshold. Too many managers watch these alerts pile up without acting.</p>
<p><strong>The fix:</strong> Treat low stock alerts as business emergencies. Every morning, a manager reviews alerts and triggers the necessary orders. This ritual takes 5 minutes and can save major sales.</p>

<h2>Conclusion</h2>
<p>These five mistakes share one thing in common: they all stem from a lack of reliable real-time information. The right tools don't replace good management — they make it possible.</p>
HTML,
                'cover_image'  => 'blog/erreurs-gestion-quincaillerie.jpg',
                'category'     => 'Gestion',
                'author_name'  => 'BATIX PRO',
                'is_published' => true,
                'published_at' => now()->subDays(22),
            ],

            // ── Article 3 ──────────────────────────────────────────────────────
            [
                'slug'       => 'choisir-logiciel-caisse-quincaillerie',
                'title_fr'   => 'Logiciel de caisse pour quincaillerie : comment bien choisir ?',
                'title_en'   => 'Hardware Store POS Software: How to Choose the Right One?',
                'excerpt_fr' => 'Tous les logiciels de caisse ne se valent pas. Un outil conçu pour une épicerie ne répondra pas aux besoins spécifiques d\'une quincaillerie. Voici les critères qui comptent vraiment.',
                'excerpt_en' => 'Not all POS software is equal. A tool built for a grocery store won\'t meet the specific needs of a hardware store. Here are the criteria that really matter.',
                'content_fr' => <<<'HTML'
<p>Face à la multiplication des solutions disponibles sur le marché, choisir un logiciel de caisse adapté à sa quincaillerie peut vite devenir un casse-tête. Voici un guide structuré pour faire le bon choix.</p>

<h2>Pourquoi un logiciel générique ne suffit pas</h2>
<p>Une quincaillerie a des besoins très spécifiques :</p>
<ul>
  <li>Des milliers de références avec des unités de mesure variées (mètre, kg, pièce, litre...)</li>
  <li>Des produits qui se vendent en gros et au détail avec des prix différents</li>
  <li>Un suivi de stock complexe avec gestion des dépôts</li>
  <li>Des ventes à crédit fréquentes avec suivi des encours clients</li>
  <li>Des achats fournisseurs réguliers à enregistrer</li>
</ul>

<h2>Les 6 critères essentiels</h2>

<h3>1. La gestion des unités de mesure</h3>
<p>Pouvez-vous vendre un câble électrique au mètre et à la bobine ? Du ciment au sac et à la tonne ? Si le logiciel ne gère pas les unités flexibles, vous allez très vite vous heurter à des limitations.</p>

<h3>2. Le suivi des ventes à crédit</h3>
<p>Le logiciel doit pouvoir enregistrer un paiement partiel, suivre le reste à payer par client, et vous alerter des échéances.</p>

<h3>3. La gestion multi-dépôts</h3>
<p>Si vous avez un magasin en façade et un dépôt en arrière-cour, vous avez besoin de voir le stock de chaque emplacement séparément, tout en ayant une vision consolidée.</p>

<h3>4. La simplicité d'utilisation au comptoir</h3>
<p>Votre logiciel sera utilisé par des vendeurs qui n'ont pas forcément de formation informatique. L'interface doit être intuitive : recherche rapide, calcul automatique de la monnaie, impression du ticket en un clic.</p>

<h3>5. Les rapports et statistiques</h3>
<p>Vous devez savoir chaque jour : quel a été mon chiffre d'affaires, quels sont mes produits les plus vendus, quelle est ma marge moyenne. Ces informations doivent être accessibles en quelques secondes.</p>

<h3>6. Le support et la formation</h3>
<p>Que se passe-t-il si vous avez un problème le lundi matin à l'ouverture ? Est-ce qu'il y a un numéro WhatsApp joignable ? Le support est souvent sous-estimé, mais c'est ce qui fait la différence dans la durée.</p>

<h2>Questions à poser avant de signer</h2>
<ul>
  <li>Le logiciel fonctionne-t-il hors connexion en cas de coupure internet ?</li>
  <li>Mes données sont-elles exportables si je veux changer de solution ?</li>
  <li>Y a-t-il une période d'essai gratuite sans engagement ?</li>
  <li>Le logiciel est-il régulièrement mis à jour ?</li>
</ul>

<h2>Conclusion</h2>
<p>Le meilleur logiciel de caisse est celui que vos vendeurs utiliseront vraiment, chaque jour, sans contournements. Privilégiez la simplicité d'usage et un support réactif. Et commencez toujours par un essai gratuit.</p>
HTML,
                'content_en' => <<<'HTML'
<p>With so many solutions available on the market, choosing the right POS software for your hardware store can quickly become overwhelming. Here is a structured guide to making the right choice.</p>

<h2>Why Generic Software Is Not Enough</h2>
<p>A hardware store has very specific needs:</p>
<ul>
  <li>Thousands of references with varied units of measure (metres, kg, pieces, litres...)</li>
  <li>Products sold wholesale and retail at different prices</li>
  <li>Complex inventory tracking with warehouse management</li>
  <li>Frequent credit sales with customer balance tracking</li>
  <li>Regular supplier purchases to record</li>
</ul>

<h2>The 6 Essential Criteria</h2>

<h3>1. Flexible Units of Measure</h3>
<p>Can you sell electrical cable by the metre and by the reel? Cement by the bag and by the tonne? If the software doesn't handle flexible units, you'll quickly run into limitations.</p>

<h3>2. Credit Sale Tracking</h3>
<p>The software must be able to record partial payments, track the remaining balance per customer, and alert you to upcoming due dates.</p>

<h3>3. Multi-Warehouse Management</h3>
<p>If you have a front store and a back warehouse, you need to see stock at each location separately while having a consolidated view.</p>

<h3>4. Ease of Use at the Counter</h3>
<p>Your software will be used by sellers who may not have IT training. The interface must be intuitive: fast product search, automatic change calculation, receipt printing in one click.</p>

<h3>5. Reports and Statistics</h3>
<p>You need to know every day: what was my revenue, what are my best-selling products, what is my average margin. This information must be accessible in seconds.</p>

<h3>6. Support and Training</h3>
<p>What happens if you have a problem on Monday morning at opening? Is there a WhatsApp number to reach? Support is often underestimated at purchase time, but it's what makes the difference over time.</p>

<h2>Questions to Ask Before Signing</h2>
<ul>
  <li>Does the software work offline in case of internet outage?</li>
  <li>Is my data exportable if I want to switch solutions?</li>
  <li>Is there a free trial period with no commitment?</li>
  <li>Is the software regularly updated?</li>
</ul>

<h2>Conclusion</h2>
<p>The best POS software is the one your sellers will actually use every day, without workarounds. Prioritise ease of use and responsive support. And always start with a free trial.</p>
HTML,
                'cover_image'  => 'blog/choisir-logiciel-caisse-quincaillerie.jpg',
                'category'     => 'Outils',
                'author_name'  => 'BATIX PRO',
                'is_published' => true,
                'published_at' => now()->subDays(15),
            ],

            // ── Article 4 ──────────────────────────────────────────────────────
            [
                'slug'       => 'reduire-pertes-vols-quincaillerie',
                'title_fr'   => 'Comment réduire les pertes et vols en quincaillerie',
                'title_en'   => 'How to Reduce Losses and Theft in Your Hardware Store',
                'excerpt_fr' => 'Les pertes en quincaillerie viennent rarement des cambriolages. Elles s\'accumulent silencieusement au quotidien. Voici comment les identifier et les réduire.',
                'excerpt_en' => 'Hardware store losses rarely come from break-ins. They accumulate silently day by day. Here is how to identify and reduce them.',
                'content_fr' => <<<'HTML'
<p>Dans une quincaillerie, les pertes se glissent partout : un vendeur qui oublie d'encaisser une vente, un produit cassé non comptabilisé, une remise non autorisée. Ces fuites peuvent représenter 5 à 15 % du chiffre d'affaires sur une année.</p>

<h2>Comprendre les différentes sources de pertes</h2>

<h3>La démarque connue</h3>
<p>Ce sont les pertes identifiées : produits cassés, abîmés, retournés. Elles doivent systématiquement être enregistrées dans votre logiciel pour que votre stock reste juste.</p>

<h3>La démarque inconnue</h3>
<p>C'est la plus dangereuse : pertes dont vous ne connaissez ni la cause ni le responsable. Elle inclut le vol par les clients, le vol par le personnel, les erreurs de caisse non détectées.</p>

<h2>Les mesures organisationnelles les plus efficaces</h2>

<h3>Séparer les accès et les responsabilités</h3>
<p>Ne laissez pas la même personne gérer les entrées de stock et les ventes en caisse. Cette séparation crée un mécanisme de contrôle naturel.</p>

<h3>Compter la caisse à chaque fin de service</h3>
<p>Un comptage rigoureux à chaque fin de service permet de détecter immédiatement tout écart. Un écart de 500 FCFA par jour sur 300 jours ouvrables, c'est 150 000 FCFA perdus dans l'année.</p>

<h3>Faire des inventaires tournants fréquents</h3>
<p>Plus vos inventaires sont fréquents, plus vous détectez les écarts rapidement. Un inventaire mensuel des catégories à risque suffit pour maintenir le contrôle.</p>

<h2>Comment les outils numériques aident</h2>
<ul>
  <li><strong>Traçabilité des ventes</strong> : chaque vente est enregistrée avec l'heure et le vendeur.</li>
  <li><strong>Contrôle des remises</strong> : limite les remises à un pourcentage maximum.</li>
  <li><strong>Historique des mouvements de stock</strong> : chaque entrée et sortie est tracée.</li>
  <li><strong>Rapport de caisse quotidien</strong> : le gérant reçoit un récapitulatif, même à distance.</li>
</ul>

<h2>Conclusion</h2>
<p>Réduire les pertes n'est pas une question de méfiance envers vos équipes — c'est une question d'organisation. Les bons processus et les bons outils protègent les honnêtes comme ils dissuadent les malhonnêtes.</p>
HTML,
                'content_en' => <<<'HTML'
<p>In a hardware store, losses creep in everywhere: a seller who forgets to ring up a sale, a broken product not recorded, an unauthorised discount. These leaks can represent 5 to 15% of annual revenue.</p>

<h2>Understanding the Different Sources of Loss</h2>

<h3>Known Shrinkage</h3>
<p>These are identified losses: broken, damaged, or returned products. They must systematically be recorded in your software to keep your stock accurate.</p>

<h3>Unknown Shrinkage</h3>
<p>This is the most dangerous: losses whose cause and responsible party you don't know. It includes customer theft, employee theft, and undetected cash register errors.</p>

<h2>The Most Effective Organisational Measures</h2>

<h3>Separate Access and Responsibilities</h3>
<p>Don't let the same person manage both stock entries and sales at the register. This separation creates a natural control mechanism.</p>

<h3>Count the Cash Register After Every Shift</h3>
<p>A rigorous count after every shift lets you immediately detect any discrepancy. A 500 FCFA gap per day over 300 working days is 150,000 FCFA lost per year.</p>

<h3>Do Frequent Cycle Counts</h3>
<p>The more frequent your counts, the faster you detect discrepancies. A monthly count of high-risk categories is enough to maintain control.</p>

<h2>How Digital Tools Help</h2>
<ul>
  <li><strong>Sales traceability</strong>: every sale is recorded with the time and seller.</li>
  <li><strong>Discount control</strong>: limits discounts to a maximum percentage.</li>
  <li><strong>Stock movement history</strong>: every entry and exit is tracked.</li>
  <li><strong>Daily cash report</strong>: the manager receives a summary, even remotely.</li>
</ul>

<h2>Conclusion</h2>
<p>Reducing losses is not about distrust of your team — it's about organisation. Good processes and the right tools protect the honest while deterring the dishonest.</p>
HTML,
                'cover_image'  => 'blog/reduire-pertes-vols-quincaillerie.jpg',
                'category'     => 'Gestion',
                'author_name'  => 'BATIX PRO',
                'is_published' => true,
                'published_at' => now()->subDays(10),
            ],

            // ── Article 5 ──────────────────────────────────────────────────────
            [
                'slug'       => 'passer-cahier-logiciel-gestion-quincaillerie',
                'title_fr'   => 'Passer d\'un cahier à un logiciel de gestion : le guide pratique',
                'title_en'   => 'Moving from a Notebook to Management Software: The Practical Guide',
                'excerpt_fr' => 'La transition du papier au numérique fait peur à beaucoup de gérants. Pourtant, avec la bonne méthode, elle se fait en moins d\'une semaine sans perturber l\'activité.',
                'excerpt_en' => 'Going paperless intimidates many store managers. Yet with the right approach, it can be done in under a week without disrupting operations.',
                'content_fr' => <<<'HTML'
<p>Nombreux sont les gérants qui reportent la digitalisation par peur de la complexité ou de la résistance des équipes. Ces craintes sont légitimes. Mais avec une méthode progressive, la transition peut se faire en douceur — et les bénéfices apparaissent dès la première semaine.</p>

<h2>Pourquoi continuer avec le cahier devient risqué</h2>
<ul>
  <li>Impossible de retrouver rapidement l'historique d'un client ou d'un produit</li>
  <li>Les totaux se font à la main — avec les erreurs que ça implique</li>
  <li>Si le cahier est perdu ou abîmé, toutes les données disparaissent</li>
  <li>Aucune visibilité en temps réel sur les performances</li>
</ul>

<h2>Étape 1 : Faire tourner les deux systèmes en parallèle</h2>
<p>La meilleure approche est de faire tourner les deux systèmes pendant 1 à 2 semaines. Cela vous permet de former les vendeurs sans pression et de vérifier que les données correspondent.</p>

<h2>Étape 2 : Saisir le catalogue produits progressivement</h2>
<p>Commencez par vos 50 à 100 produits les plus vendus. Ils représentent probablement 80 % de votre chiffre d'affaires. Vous saisirez le reste au fur et à mesure.</p>
<p>Pour chaque produit, préparez : nom, prix de vente, prix d'achat, stock actuel, stock minimum, catégorie.</p>

<h2>Étape 3 : Former les vendeurs en situation réelle</h2>
<p>La meilleure formation se fait sur le tas. Organisez une demi-journée où un responsable guide chaque vendeur. Après 10 à 15 ventes accompagnées, la plupart sont autonomes.</p>

<h2>Étape 4 : Couper le cordon avec le cahier</h2>
<p>Après 2 semaines de double saisie, arrêtez le cahier. Tant qu'il reste là "en secours", les vendeurs y reviendront dès qu'ils rencontrent une difficulté.</p>

<h2>Les premiers bénéfices ressentis</h2>
<ul>
  <li>Le comptage de caisse prend 2 minutes au lieu de 30</li>
  <li>Vous voyez vos ventes depuis votre téléphone, même absent</li>
  <li>Les erreurs de rendu de monnaie disparaissent presque entièrement</li>
</ul>

<h2>Conclusion</h2>
<p>La transition vers un logiciel de gestion n'est pas un saut dans le vide — c'est une migration progressive. L'essentiel est de commencer. Dans 3 mois, vous ne comprendrez plus comment vous faisiez avant.</p>
HTML,
                'content_en' => <<<'HTML'
<p>Many managers put off digitalisation out of fear of complexity or team resistance. These concerns are legitimate. But with a gradual approach, the transition can be smooth — and the benefits appear within the first week.</p>

<h2>Why Sticking With the Notebook Is Becoming Risky</h2>
<ul>
  <li>Impossible to quickly retrieve a customer's or product's history</li>
  <li>Totals are calculated by hand — with all the errors that entails</li>
  <li>If the notebook is lost or damaged, all data is gone</li>
  <li>No real-time visibility on performance</li>
</ul>

<h2>Step 1: Run Both Systems in Parallel</h2>
<p>The best approach is to run both systems for 1 to 2 weeks. This allows you to train sellers without pressure and verify that data matches.</p>

<h2>Step 2: Enter Your Product Catalogue Progressively</h2>
<p>Start with your 50 to 100 best-selling products. They likely represent 80% of your revenue. You'll add the rest over time.</p>
<p>For each product, prepare: name, selling price, purchase price, current stock, minimum stock, category.</p>

<h2>Step 3: Train Staff in Real Conditions</h2>
<p>The best training happens on the job. Set aside half a day where a supervisor guides each seller. After 10 to 15 assisted sales, most become independent.</p>

<h2>Step 4: Cut the Cord With the Notebook</h2>
<p>After 2 weeks of double entry, stop the notebook. As long as it stays there "as backup," sellers will fall back on it whenever they encounter difficulty.</p>

<h2>First Benefits You'll Notice</h2>
<ul>
  <li>Cash counting takes 2 minutes instead of 30</li>
  <li>You can see your sales from your phone, even when away</li>
  <li>Change-giving errors almost completely disappear</li>
</ul>

<h2>Conclusion</h2>
<p>Moving to management software is not a leap in the dark — it's a gradual migration. The key is to start. In 3 months, you won't understand how you managed before.</p>
HTML,
                'cover_image'  => 'blog/passer-cahier-logiciel-gestion-quincaillerie.jpg',
                'category'     => 'Conseils',
                'author_name'  => 'BATIX PRO',
                'is_published' => true,
                'published_at' => now()->subDays(5),
            ],

            // ── Article 6 ──────────────────────────────────────────────────────
            [
                'slug'       => 'indicateurs-pilotage-quincaillerie',
                'title_fr'   => 'Quels indicateurs suivre pour piloter sa quincaillerie comme un pro ?',
                'title_en'   => 'What KPIs Should You Track to Run Your Hardware Store Like a Pro?',
                'excerpt_fr' => 'Beaucoup de gérants regardent uniquement leur caisse en fin de journée. Mais ce chiffre seul ne dit pas si l\'activité est vraiment saine. Voici les 7 indicateurs essentiels.',
                'excerpt_en' => 'Many managers only look at their cash register at the end of the day. But that number alone doesn\'t tell you if the business is truly healthy. Here are the 7 essential KPIs.',
                'content_fr' => <<<'HTML'
<p>Piloter une quincaillerie à l'intuition, ça marche jusqu'à un certain point. Quand l'activité grandit, les décisions basées sur le ressenti deviennent risquées. Voici les 7 indicateurs que tout gérant sérieux devrait surveiller chaque semaine.</p>

<h2>1. Le chiffre d'affaires journalier et hebdomadaire</h2>
<p>C'est le point de départ. Mais comparez-le à la même période de l'année précédente et à votre objectif mensuel. La tendance compte plus que le chiffre brut.</p>

<h2>2. La marge brute par catégorie de produits</h2>
<p>Vendre 500 000 FCFA de ciment avec une marge de 8 % est moins rentable que vendre 300 000 FCFA de vis avec une marge de 40 %. Analysez régulièrement quelles catégories génèrent vraiment de la valeur.</p>

<h2>3. Le taux de rupture de stock</h2>
<p>Combien de fois dans la semaine un client a-t-il demandé un produit que vous n'aviez pas ? Chaque rupture est une vente perdue et potentiellement un client perdu.</p>

<h2>4. Le montant des créances clients</h2>
<p>Si vous faites des ventes à crédit, suivez de près le total des sommes dues. Une créance qui grossit sans être encaissée, c'est de la trésorerie bloquée.</p>

<h2>5. La rotation des stocks</h2>
<p>Une rotation faible signifie que vous avez des produits qui dorment et immobilisent du capital. Identifiez ces "dormeurs" et décidez : promotion, retour fournisseur, ou arrêt de la référence.</p>
<p><strong>Formule :</strong> Ventes de la période ÷ Stock moyen = Taux de rotation</p>

<h2>6. Le panier moyen</h2>
<p>Un panier moyen qui augmente signifie que vos vendeurs font des ventes complémentaires. Un panier qui diminue peut signaler une concurrence accrue ou une perte de confiance des clients.</p>

<h2>7. La performance par vendeur</h2>
<p>Ces données ne servent pas à créer une compétition malsaine, mais à identifier les bonnes pratiques à partager et les vendeurs qui ont besoin d'accompagnement.</p>

<h2>Conclusion</h2>
<p>Ces 7 indicateurs forment le minimum vital pour piloter votre quincaillerie avec sérénité. Commencez par en suivre 2 ou 3 régulièrement. Ce qui est mesuré est géré. Ce qui ne l'est pas est subi.</p>
HTML,
                'content_en' => <<<'HTML'
<p>Running a hardware store on gut feeling works — up to a point. As the business grows, decisions based on instinct become risky. Here are the 7 KPIs every serious manager should monitor every week.</p>

<h2>1. Daily and Weekly Revenue</h2>
<p>This is the starting point. But compare it to the same period last year and to your monthly target. The trend matters more than the raw number.</p>

<h2>2. Gross Margin by Product Category</h2>
<p>Selling a large volume of cement at an 8% margin is less profitable than selling hardware at 40%. Regularly analyse which categories truly generate value for your business.</p>

<h2>3. Stockout Rate</h2>
<p>How many times in a week did a customer ask for a product you didn't have? Each stockout is a lost sale and potentially a lost customer.</p>

<h2>4. Outstanding Customer Credit</h2>
<p>If you do credit sales, closely monitor the total amount owed. Credit that grows without being collected is locked-up cash flow.</p>

<h2>5. Stock Turnover Rate</h2>
<p>A low turnover rate means you have products sitting idle, tying up capital. Identify these "sleepers" and decide: promotion, return to supplier, or discontinue the reference.</p>
<p><strong>Formula:</strong> Period Sales ÷ Average Stock = Turnover Rate</p>

<h2>6. Average Transaction Value</h2>
<p>A rising average basket means your sellers are making complementary sales. A falling one may signal increased competition or declining customer confidence.</p>

<h2>7. Performance by Seller</h2>
<p>This data is not meant to create unhealthy competition, but to identify best practices to share and sellers who need coaching.</p>

<h2>Conclusion</h2>
<p>These 7 KPIs are the minimum needed to run your hardware store with confidence. Start by tracking 2 or 3 regularly. What gets measured gets managed. What doesn't is left to chance.</p>
HTML,
                'cover_image'  => 'blog/indicateurs-pilotage-quincaillerie.jpg',
                'category'     => 'Pilotage',
                'author_name'  => 'BATIX PRO',
                'is_published' => true,
                'published_at' => now()->subDays(2),
            ],

        ];

        foreach ($posts as $data) {
            Post::updateOrCreate(['slug' => $data['slug']], $data);
        }

        $this->command->info('✓ ' . count($posts) . ' articles de blog insérés (FR + EN).');
    }
}
