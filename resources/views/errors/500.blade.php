@extends('errors::layout')

@section('title', __('errors.500.title'))
@section('code', '500')
@section('message', __('errors.500.message'))
@section('actions')
    <button type="button" class="btn primary" onclick="location.reload()">{{ __('errors.retry') }}</button>
@endsection
