<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            // Le pays n'était saisissable qu'à l'inscription : une erreur y était
            // définitive. Il sert de défaut aux boutiques créées ensuite
            // (ShopController), d'où l'intérêt de pouvoir le corriger.
            'country' => ['nullable', 'string', 'max:100'],
        ];
    }
}
