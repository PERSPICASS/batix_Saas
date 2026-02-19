# 🎨 Système de Toast et Dialog de Confirmation

## 📋 Vue d'ensemble

Ce système fournit des composants réutilisables pour afficher des notifications toast et des dialogues de confirmation dans l'application.

---

## 🍞 Toast Notifications

### Composants

1. **Toast.tsx** - Composant de notification individuel
2. **ToastContainer.tsx** - Gestionnaire de toasts (déjà intégré dans AuthenticatedLayout)

### Types de Toast

- ✅ **success** - Succès (vert)
- ❌ **error** - Erreur (rouge)
- ⚠️ **warning** - Avertissement (jaune)
- ℹ️ **info** - Information (bleu)

### Utilisation côté Backend (Laravel)

```php
// Succès
return redirect()->route('users.index')
    ->with('success', 'Utilisateur créé avec succès.');

// Erreur
return redirect()->route('users.index')
    ->with('error', 'Une erreur est survenue.');

// Avertissement
return redirect()->route('users.index')
    ->with('warning', 'Attention : action à confirmer.');

// Information
return redirect()->route('users.index')
    ->with('info', 'Nouvelles mises à jour disponibles.');
```

### Caractéristiques

- 🎭 Animation d'entrée et de sortie fluide
- ⏱️ Fermeture automatique après 5 secondes (configurable)
- 🖱️ Fermeture manuelle avec le bouton X
- 📱 Responsive et empilable
- 🎨 Design cohérent avec le thème de l'application

---

## 🗑️ Dialog de Confirmation (ConfirmDialog)

### Utilisation

#### 1. Importer le composant

```tsx
import ConfirmDialog from '@/Components/ConfirmDialog';
import { useState } from 'react';
```

#### 2. Définir l'état

```tsx
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
```

#### 3. Fonction de déclenchement

```tsx
const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
};
```

#### 4. Fonction de confirmation

```tsx
const handleConfirmDelete = () => {
    if (itemToDelete) {
        setIsDeleting(true);
        router.delete(route('items.destroy', itemToDelete.id), {
            onFinish: () => {
                setIsDeleting(false);
                setShowDeleteDialog(false);
                setItemToDelete(null);
            },
        });
    }
};
```

#### 5. Ajouter le composant dans le JSX

```tsx
<ConfirmDialog
    show={showDeleteDialog}
    onClose={() => setShowDeleteDialog(false)}
    onConfirm={handleConfirmDelete}
    title="Supprimer l'élément"
    message={`Êtes-vous sûr de vouloir supprimer "${itemToDelete?.name}" ? Cette action est irréversible.`}
    confirmText="Supprimer"
    cancelText="Annuler"
    type="danger"
    isProcessing={isDeleting}
/>
```

### Props du ConfirmDialog

| Prop | Type | Obligatoire | Description |
|------|------|-------------|-------------|
| `show` | boolean | ✅ | Afficher/masquer le dialog |
| `onClose` | () => void | ✅ | Fonction appelée à la fermeture |
| `onConfirm` | () => void | ✅ | Fonction appelée à la confirmation |
| `title` | string | ✅ | Titre du dialog |
| `message` | string | ✅ | Message d'avertissement |
| `confirmText` | string | ❌ | Texte du bouton de confirmation (défaut: "Confirmer") |
| `cancelText` | string | ❌ | Texte du bouton d'annulation (défaut: "Annuler") |
| `type` | 'danger' \| 'warning' \| 'info' | ❌ | Type de dialog (défaut: "danger") |
| `isProcessing` | boolean | ❌ | État de chargement (défaut: false) |

### Types de Dialog

- 🔴 **danger** - Pour les suppressions (rouge)
- 🟡 **warning** - Pour les avertissements (jaune)
- 🔵 **info** - Pour les informations (bleu)

---

## 📝 Exemple Complet

Voir l'implémentation dans `/resources/js/Pages/Users/Index.tsx`

```tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import ConfirmDialog from '@/Components/ConfirmDialog';

export default function UsersIndex({ users }: Props) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            setIsDeleting(true);
            router.delete(route('users.destroy', userToDelete.id), {
                onFinish: () => {
                    setIsDeleting(false);
                    setShowDeleteDialog(false);
                    setUserToDelete(null);
                },
            });
        }
    };

    return (
        <>
            {/* Votre contenu */}
            <button onClick={() => handleDeleteClick(user)}>
                Supprimer
            </button>

            {/* Dialog de confirmation */}
            <ConfirmDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
                title="Supprimer l'utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer "${userToDelete?.name}" ?`}
                type="danger"
                isProcessing={isDeleting}
            />
        </>
    );
}
```

---

## 🎯 Bonnes Pratiques

### Toast

1. ✅ Utilisez des messages courts et clairs
2. ✅ Préférez `success` pour les confirmations d'actions
3. ✅ Utilisez `error` pour les échecs d'opérations
4. ✅ `warning` pour les avertissements non bloquants
5. ✅ `info` pour les messages informatifs

### ConfirmDialog

1. ✅ Toujours demander confirmation pour les suppressions
2. ✅ Utilisez `type="danger"` pour les actions irréversibles
3. ✅ Incluez le nom de l'élément dans le message
4. ✅ Gérez l'état `isProcessing` pour éviter les double-clics
5. ✅ Réinitialisez tous les états après fermeture

---

## 🚀 Prochaines Étapes

Pour utiliser ces composants dans d'autres pages :

1. Importez `ConfirmDialog` dans votre page
2. Ajoutez les états nécessaires
3. Remplacez les `confirm()` natifs par le dialog
4. Les toasts fonctionnent automatiquement via les flash messages Laravel

Enjoy! 🎉
