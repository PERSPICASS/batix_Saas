# Interface Utilisateur - Catégories de Quincaillerie

## 🎨 Exemples d'intégration dans l'UI

### 1. Affichage des catégories avec couleurs (React/TypeScript)

```tsx
// Dans un composant de liste de catégories
import { usePage } from '@inertiajs/react';

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
  description: string;
  icon: string;
}

export default function CategoryList() {
  const { categories } = usePage<{ categories: Category[] }>().props;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            {/* Pastille de couleur */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: category.color + '20' }}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
            
            {/* Informations */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2. Sélecteur de catégories dans un formulaire

```tsx
// Dans un formulaire de produit
export default function ProductForm() {
  const { categories } = usePage().props;
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Catégorie *
      </label>
      
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full rounded-lg border-gray-300"
      >
        <option value="">Sélectionnez une catégorie</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Aperçu de la catégorie sélectionnée */}
      {selectedCategory && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ 
              backgroundColor: categories.find(c => c.id === parseInt(selectedCategory))?.color 
            }}
          />
          <span className="text-sm text-gray-600">
            {categories.find(c => c.id === parseInt(selectedCategory))?.description}
          </span>
        </div>
      )}
    </div>
  );
}
```

### 3. Grille de catégories avec cartes cliquables

```tsx
export default function CategoryGrid() {
  const { categories } = usePage().props;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 text-left"
        >
          {/* Barre de couleur en haut */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
            style={{ backgroundColor: category.color }}
          />
          
          {/* Contenu */}
          <div className="pt-2">
            <div
              className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: category.color + '20' }}
            >
              <span
                className="text-2xl"
                style={{ color: category.color }}
              >
                🔧
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1">
              {category.name}
            </h3>
            
            <p className="text-xs text-gray-500 line-clamp-2">
              {category.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
```

### 4. Menu de navigation latéral avec catégories

```tsx
export default function CategorySidebar() {
  const { categories } = usePage().props;
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Catégories
        </h2>
        
        <nav className="space-y-1">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${activeCategory === category.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              {/* Indicateur de couleur */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              
              {/* Nom de la catégorie */}
              <span className="text-sm font-medium truncate">
                {category.name}
              </span>
              
              {/* Badge de compteur (optionnel) */}
              <span className="ml-auto text-xs text-gray-400">
                {category.products_count || 0}
              </span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
```

### 5. Filtres de catégories

```tsx
export default function CategoryFilters() {
  const { categories } = usePage().props;
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Filtrer par catégorie
      </h3>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
              className="rounded border-gray-300"
              style={{ accentColor: category.color }}
            />
            
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            
            <span className="text-sm text-gray-700 flex-1">
              {category.name}
            </span>
            
            <span className="text-xs text-gray-400">
              ({category.products_count || 0})
            </span>
          </label>
        ))}
      </div>
      
      {/* Actions */}
      {selectedCategories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => setSelectedCategories([])}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleApplyFilters}
            className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Appliquer ({selectedCategories.length})
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6. Badges de catégories sur les produits

```tsx
export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Image du produit */}
      <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-lg" />
      
      {/* Informations */}
      <div className="mt-3">
        {/* Badge de catégorie */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: product.category.color + '20',
              color: product.category.color
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: product.category.color }}
            />
            {product.category.name}
          </div>
        </div>
        
        {/* Nom et prix */}
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <p className="text-lg font-bold text-gray-900 mt-1">{product.price} €</p>
      </div>
    </div>
  );
}
```

## 📊 Partage des catégories avec Inertia

Dans votre contrôleur Laravel :

```php
use App\Models\Category;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $activeShopId = session('active_shop_id');
        
        return Inertia::render('Products/Index', [
            'categories' => Category::where('shop_id', $activeShopId)
                ->orderBy('order')
                ->get()
                ->map(fn($cat) => [
                    'id' => $cat->id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'description' => $cat->description,
                    'color' => $cat->color,
                    'icon' => $cat->icon,
                    'products_count' => $cat->products()->count(),
                ]),
        ]);
    }
    
    public function create()
    {
        $activeShopId = session('active_shop_id');
        
        return Inertia::render('Products/Create', [
            'categories' => Category::where('shop_id', $activeShopId)
                ->where('is_active', true)
                ->orderBy('order')
                ->get(['id', 'name', 'slug', 'color', 'description']),
        ]);
    }
}
```

## 🎨 Palette de couleurs des catégories

Voici les couleurs utilisées pour chaque groupe de catégories :

```css
/* Outils */
--outils-main: #EF4444;      /* Rouge */
--outils-elec: #F59E0B;      /* Ambre */
--mesure: #3B82F6;           /* Bleu */

/* Quincaillerie */
--visserie: #64748B;         /* Slate */
--clous: #78716C;            /* Stone */
--assemblage: #6366F1;       /* Indigo */

/* Serrurerie */
--serrure: #8B5CF6;          /* Violet */
--charnieres: #A855F7;       /* Violet clair */
--poignees: #EC4899;         /* Rose */

/* Matériaux */
--construction: #94A3B8;     /* Gris */
--bois: #92400E;             /* Marron */
--tubes: #475569;            /* Slate foncé */

/* Techniques */
--plomberie: #06B6D4;        /* Cyan */
--electricite: #FBBF24;      /* Jaune */

/* Peinture */
--peinture: #10B981;         /* Vert */
--outils-peinture: #14B8A6;  /* Teal */

/* Fixation */
--colles: #F97316;           /* Orange */
--fixations: #DC2626;        /* Rouge foncé */

/* Protection */
--epi: #059669;              /* Vert foncé */
--securite: #DC2626;         /* Rouge */

/* Extérieur */
--jardinage: #84CC16;        /* Lime */
--amenagement: #22C55E;      /* Vert vif */

/* Entretien */
--produits: #38BDF8;         /* Sky */
--materiel: #0EA5E9;         /* Bleu clair */

/* Divers */
--rangement: #7C3AED;        /* Violet foncé */
--accessoires: #64748B;      /* Slate */
--autres: #9CA3AF;           /* Gris clair */
```

## 💡 Conseils d'utilisation

1. **Cohérence** : Utilisez toujours les couleurs définies pour chaque catégorie
2. **Accessibilité** : Ajoutez un texte alternatif, ne vous fiez pas qu'aux couleurs
3. **Performance** : Cachez les catégories avec `->where('is_active', true)`
4. **Compteurs** : Affichez le nombre de produits par catégorie pour guider l'utilisateur
5. **Filtrage** : Permettez de filtrer par plusieurs catégories simultanément
6. **Recherche** : Intégrez une recherche dans les catégories pour les grandes listes

## 🚀 Prêt à l'emploi

Ces exemples sont prêts à être intégrés dans votre application. Adaptez simplement les styles à votre design system !
