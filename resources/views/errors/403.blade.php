@php
    // Le motif précis passé à abort(403, '…') quand il y en a un ; le texte générique
    // de Laravel (« This action is unauthorized. ») n'apprend rien à l'utilisateur.
    $reason = $exception->getMessage();
    if (in_array($reason, ['', 'This action is unauthorized.', 'Forbidden'], true)) {
        $reason = null;
    }
    // « Demandez à l'administrateur » n'a pas de sens pour l'administrateur lui-même.
    try {
        $isOwner = in_array(auth()->user()?->role, ['super_admin', 'admin_platforme'], true);
    } catch (\Throwable) {
        $isOwner = false;
    }
    $message = $reason ? '' : __('errors.403.message');
    if (!$isOwner) {
        $message = trim($message . ' ' . __('errors.403.hint'));
    }
@endphp
@extends('errors::layout')

@section('title', __('errors.403.title'))
@section('code', '403')
@if ($reason)
    @section('detail', $reason)
@endif
@if ($message !== '')
    @section('message', $message)
@endif
