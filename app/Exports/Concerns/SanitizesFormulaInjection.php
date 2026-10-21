<?php

namespace App\Exports\Concerns;

use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;

/**
 * Neutralizes CSV/Excel formula injection (CWE-1236): tenant-controlled strings
 * (product/customer names, notes, references...) end up as cell values in these
 * exports. A value starting with =, +, -, @, tab or CR is interpreted as a formula
 * by Excel/LibreOffice on open — combined with import/export functions or DDE, this
 * can leak data or execute commands on whoever opens the file. Force such values to
 * be stored as plain text instead of falling through to the default formula-sniffing
 * behavior.
 */
trait SanitizesFormulaInjection
{
    public function bindValue(Cell $cell, $value)
    {
        if (is_string($value) && $value !== '' && str_contains("=+-@\t\r", $value[0])) {
            $cell->setValueExplicit("'" . $value, DataType::TYPE_STRING);

            return true;
        }

        return (new DefaultValueBinder())->bindValue($cell, $value);
    }
}
