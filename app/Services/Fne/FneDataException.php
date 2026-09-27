<?php

namespace App\Services\Fne;

use RuntimeException;

/**
 * Le document ne peut pas être présenté à la FNE tel quel : taux de TVA inconnu de la
 * DGI, client B2B sans NCC, boutique sans établissement… Détecté avant tout appel — la
 * DGI le refuserait de toute façon, et on garde son message pour l'utilisateur.
 */
class FneDataException extends RuntimeException
{
}
