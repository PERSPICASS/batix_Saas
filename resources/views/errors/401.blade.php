@extends('errors::layout')

@section('title', __('errors.401.title'))
@section('code', '401')
@section('message', __('errors.401.message'))
@section('actions')
    <a class="btn primary" href="{{ route('login') }}">{{ __('errors.login') }}</a>
@endsection
