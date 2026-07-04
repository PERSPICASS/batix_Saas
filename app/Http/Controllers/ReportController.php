<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;
use App\Exports\AnalyticsExport;

class ReportController extends Controller
{
    public function analytics(string $code_user): Response
    {
        $shop = current_shop();

        return inertia('Reports/Analytics', [
            'shop' => $shop,
        ]);
    }

    public function exportAnalytics(string $code_user, Request $request)
    {
        $shop = current_shop();

        abort_if(!$shop, 400, 'Aucune boutique sélectionnée.');

        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\ComprehensiveReportExport($shop->id, $validated['start_date'], $validated['end_date']),
            'Rapport_Analytique_Factures_Devis-' . now()->format('Y-m-d') . '.xlsx'
        );
    }
}
