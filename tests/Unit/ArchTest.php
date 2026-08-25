<?php

arch()->preset()->laravel();
arch()->preset()->php();
arch()->preset()->security();
// Models stay open and keep Eloquent's protected hooks: a final User would make
// PHPStan read the MustVerifyEmail check in the profile API as dead code.
arch()->preset()->strict()->ignoring('App\\Models');
