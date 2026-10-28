@extends('errors::layout')

@section('title', __('errors.503.title'))
@section('code', '503')
@section('message', __('errors.503.message'))
@section('actions')
    <button type="button" class="btn primary" onclick="location.reload()">{{ __('errors.retry') }}</button>
@endsection
