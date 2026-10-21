@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
{{-- Le bloc-marque, la ou le stub vendor rendait config('app.name') en texte brut.
     Ne pas le laisser reecraser par `vendor:publish --tag=laravel-mail --force`
     (MailHeaderBrandingTest garde le fichier).
     URL absolue obligatoire : un client mail ne resout pas les chemins relatifs. --}}
<img src="{{ rtrim(config('app.url'), '/') }}/images/logo-batixpro.png" class="logo" alt="BATIX PRO">
</a>
</td>
</tr>
