<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;

class PdfExporter
{
    public static function generateSaleReceipt($sale)
    {
        $sale->load(['shop', 'customer', 'items.product']);

        $html = view('pdfs.sale-receipt', ['sale' => $sale])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10)
            ->setOption('isHtml5ParserEnabled', true);
    }

    public static function generateInvoice($invoice)
    {
        $invoice->load(['shop', 'customer', 'items']);

        $html = view('pdfs.invoice', ['invoice' => $invoice])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10)
            ->setOption('isHtml5ParserEnabled', true);
    }

    public static function generateCreditsReport($credits)
    {
        $html = view('pdfs.credits-report', ['credits' => $credits])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10)
            ->setOption('isHtml5ParserEnabled', true);
    }

    public static function generateSalesReport($sales, $period)
    {
        $html = view('pdfs.sales-report', ['sales' => $sales, 'period' => $period])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'landscape')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10)
            ->setOption('isHtml5ParserEnabled', true);
    }
}
