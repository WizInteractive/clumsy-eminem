<?php

namespace Wizclumsy\Eminem;

use Illuminate\Support\ServiceProvider;
use Wizclumsy\Assets\Facade as Asset;

class EminemServiceProvider extends ServiceProvider
{
    /**
     * Indicates if loading of the provider is deferred.
     *
     * @var bool
     */
    protected $defer = false;

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->register('Intervention\Image\ImageServiceProvider');

        $this->mergeConfigFrom(__DIR__.'/config/config.php', 'clumsy.eminem');

        $this->app->bind('eminem', function ($app) {
            return new MediaManager;
        });
    }

    /**
     * Boot the service provider.
     *
     * @return void
     */
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        $this->loadTranslationsFrom(__DIR__.'/lang', 'clumsy/eminem');

        $this->publishes([
            __DIR__.'/config/config.php'  => config_path('clumsy/eminem.php'),
        ], 'config');

        $this->publishes([
            __DIR__.'/lang' => base_path('resources/lang/vendor/clumsy/eminem'),
        ], 'translations');

        $this->publishes([
            __DIR__.'/views' => base_path('resources/views/vendor/clumsy/eminem'),
        ], 'views');

        $this->publishes([
            __DIR__.'/../public' => public_path('vendor/clumsy/eminem'),
        ], 'public');

        $this->registerRoutes();

        $assets = require(__DIR__.'/assets/assets.php');
        Asset::batchRegister($assets);

        $this->loadViewsFrom(__DIR__.'/views', 'clumsy/eminem');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return array(
            'eminem',
        );
    }

    public function registerRoutes()
    {
        /*
        |--------------------------------------------------------------------------
        | Uploading and editing
        |--------------------------------------------------------------------------
        |
        */

        $this->app['router']->group([
                'prefix'     => config('clumsy.eminem.input-prefix'),
                'middleware' => config('clumsy.eminem.input-middleware'),
            ], function () {

                $this->app['router']->match(['POST', 'PUT'], 'media-upload', [
                    'as'   => 'eminem.upload',
                    'uses' => 'Wizclumsy\Eminem\Controllers\MediaController@upload'
                ]);

                $this->app['router']->post('media-save-meta/{id?}', [
                    'as'   => 'eminem.save-meta',
                    'uses' => 'Wizclumsy\Eminem\Controllers\MediaController@meta'
                ]);
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Processing and response
        |--------------------------------------------------------------------------
        |
        */

        $this->app['router']->group([
                'prefix'     => config('clumsy.eminem.output-prefix'),
                'middleware' => config('clumsy.eminem.output-middleware'),
            ], function () {

                $this->app['router']->pattern('eminemMedia', '.+'); // Allows media path to have forward slashes

                $this->app['router']->bind('eminemMedia', function ($value) {
                    return $this->app['eminem']->media()->where('path', $value)->first();
                });

                $this->app['router']->get('eminem/output/{eminemMedia}', [
                    'as'   => 'eminem.media-route',
                    'uses' => 'Wizclumsy\Eminem\Controllers\MediaController@outputMedia',
                ]);
            }
        );
    }
}
