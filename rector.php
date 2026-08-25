<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\TypeDeclaration\Rector\StmtsAwareInterface\DeclareStrictTypesRector;
use RectorLaravel\Set\LaravelSetList;

return RectorConfig::configure()
    // Same paths PHPStan analyses, plus the tests.
    ->withPaths([
        __DIR__.'/app',
        __DIR__.'/bootstrap/app.php',
        __DIR__.'/config',
        __DIR__.'/database',
        __DIR__.'/routes',
        __DIR__.'/tests',
    ])
    ->withPhpSets()
    ->withPreparedSets(deadCode: true, codeQuality: true, typeDeclarations: true)
    ->withSets([
        LaravelSetList::LARAVEL_CODE_QUALITY,
        LaravelSetList::LARAVEL_130,
    ])
    // The arch test's strict preset demands it in every file, so add it unconditionally —
    // the prepared set's "safe" variant skips any file holding a call it cannot resolve.
    ->withRules([DeclareStrictTypesRector::class])
    // A type Rector adds becomes a `use` statement instead of an inline \Fully\Qualified\Name.
    ->withImportNames(importShortClasses: false);
