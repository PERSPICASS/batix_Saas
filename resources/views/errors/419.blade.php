@extends('errors::layout')

@section('title', __('errors.419.title'))
@section('code', '419')
@section('message', __('errors.419.message'))
@section('actions')
    <button type="button" class="btn primary" onclick="location.reload()">{{ __('errors.reload') }}</button>
@endsection
