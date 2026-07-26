<?php

/**
 * Mind the path: Laravel reads `resources/lang` whenever that directory exists, and then
 * ignores the root `lang/` — which holds messages.php, fields.php and validation.php, never
 * loaded. New server-side translations belong here.
 */
return [
    'updated' => 'Profile updated.',
];
