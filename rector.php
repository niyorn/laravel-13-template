<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\TypeDeclaration\Rector\StmtsAwareInterface\SafeDeclareStrictTypesRector;
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
    // A type Rector adds becomes a `use` statement instead of an inline \Fully\Qualified\Name.
    ->withImportNames(importShortClasses: false)
    ->withSkip([
        // Laravel's own skeleton ships without it, so adding it everywhere is noise.
        SafeDeclareStrictTypesRector::class,
    ]);
