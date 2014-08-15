<?php namespace Clumsy\Eminem\Models;

use Illuminate\Support\Facades\URL;

class Media extends \Eloquent {
    
    protected $table = 'media';
    
    protected $guarded = array('id');

    public function path()
    {
        return $this->path_type === 'absolute' ? $this->path : URL::to($this->path);
    }

    public function bind($options = array())
    {
        $defaults = array(
            'association_id'   => null,
            'association_type' => null,
            'position'         => null,
            'allow_multiple'   => false,
        );

        $options = array_merge($defaults, $options);
        extract($options, EXTR_SKIP);

        if ((int)$association_id !== 0)
        {
            if (!$allow_multiple)
            {
                $existing = MediaAssociation::where('media_association_id', $association_id);

                if ($association_type !== null)
                {
                    $existing->where('media_association_type', $association_type);
                }

                if ($position !== null)
                {
                    $existing->where('position', $position);
                }
                
                $existing->delete();
            }

            return MediaAssociation::create(array(
                'media_id'               => $this->id,
                'media_association_type' => $association_type,
                'media_association_id'   => $association_id,
                'position'               => $position,
            ));
        }
    }
}