<?php

return [
    'code' => 'Error :code',
    'back' => 'Go back',
    'dashboard' => 'Dashboard',
    'home' => 'Back to home',
    'login' => 'Log in',
    'reload' => 'Reload the page',
    'retry' => 'Try again',

    '401' => ['title' => 'Login required', 'message' => 'Log in to access this page.'],
    '402' => ['title' => 'Subscription required', 'message' => 'This feature is not included in your current subscription.'],
    '403' => [
        'title' => 'Access denied',
        'message' => 'Your account does not have access to this page.',
        'hint' => 'If you need it, ask the account administrator to grant you this right (Users → Permissions).',
    ],
    '404' => ['title' => 'Page not found', 'message' => 'This page does not exist or no longer exists. Check the address, or the item may have been deleted.'],
    '419' => ['title' => 'Session expired', 'message' => 'The page was left open too long. Reload it, then try again.'],
    '429' => ['title' => 'Too many attempts', 'message' => 'Please wait a minute before trying again.'],
    '500' => ['title' => 'Something went wrong', 'message' => 'The problem is on our side and the team has been notified. Try again in a moment.'],
    '503' => ['title' => 'Maintenance in progress', 'message' => 'BATIX PRO is being updated. The app will be back in a few minutes.'],

    'permission' => 'You do not have the right to :action: :module.',
    'actions' => ['view' => 'view', 'create' => 'create', 'edit' => 'edit', 'delete' => 'delete'],
    'modules' => [
        'products' => 'Products', 'categories' => 'Categories', 'customers' => 'Customers', 'quotes' => 'Quotes',
        'preorders' => 'Pre-orders', 'invoices' => 'Invoices', 'recurring_invoices' => 'Recurring invoices',
        'sales' => 'Sales', 'sales_delete' => 'Cancel a sale', 'sales_restore' => 'Reactivate a sale',
        'returns' => 'Returns', 'returned_inventory' => 'Returned inventory', 'credits' => 'Receivables',
        'stocks' => 'Stock movements', 'inventory' => 'Inventory', 'depots' => 'Depots', 'suppliers' => 'Suppliers',
        'purchases' => 'Purchases', 'expenses' => 'Expenses', 'users' => 'Users', 'shops' => 'Shops',
        'analytics' => 'Analytics', 'activity_logs' => 'Activity logs', 'settings' => 'Settings',
    ],
];
