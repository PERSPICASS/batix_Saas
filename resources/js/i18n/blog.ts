export const blog = {
    fr: {
        title: 'Blog',
        columns: {
            title: 'Titre',
            author: 'Auteur',
            date: 'Date',
            status: 'Statut',
        },
        form: {
            title: 'Titre',
            content: 'Contenu',
            slug: 'Slug',
            published: 'Publié',
        },
        actions: {
            new: 'Nouvel article',
            edit: 'Modifier',
            delete: 'Supprimer',
        },
        emptyMessage: 'Aucun {} trouvé'.replace('{}', 'blog'),
    },
    en: {
        title: 'Blog',
        columns: {
            title: 'Title',
            author: 'Author',
            date: 'Date',
            status: 'Status',
        },
        form: {
            title: 'Title',
            content: 'Content',
            slug: 'Slug',
            published: 'Published',
        },
        actions: {
            new: 'New',
            edit: 'Edit',
            delete: 'Delete',
        },
        emptyMessage: 'No records found',
    },
} as const;
