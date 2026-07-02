<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCustomerApiRequest;
use App\Http\Requests\Api\V1\UpdateCustomerApiRequest;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\Customer;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    use ScopesToAccessibleShops;

    public function index(Request $request): AnonymousResourceCollection
    {
        $customers = Customer::whereIn('shop_id', $this->resolveShopIds($request))
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%' . $request->query('search') . '%'))
            ->orderByDesc('updated_at')
            ->paginate($this->resolvePerPage($request));

        return CustomerResource::collection($customers);
    }

    public function show(Request $request, Customer $customer): CustomerResource
    {
        abort_unless(in_array($customer->shop_id, $this->resolveShopIds($request), true), 404);

        return new CustomerResource($customer);
    }

    public function store(StoreCustomerApiRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Aborts with 403 if shop_id isn't one of the token's accessible shops.
        $this->resolveShopIds($request);

        $shop = $request->user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        $customer = $shop->customers()->create($validated);

        ActivityLogger::created($customer, $customer->name);

        return (new CustomerResource($customer))->response()->setStatusCode(201);
    }

    public function update(UpdateCustomerApiRequest $request, Customer $customer): CustomerResource
    {
        abort_unless(in_array($customer->shop_id, $this->resolveShopIds($request), true), 404);

        $customer->update($request->validated());

        ActivityLogger::updated($customer, [], $customer->name);

        return new CustomerResource($customer);
    }
}
