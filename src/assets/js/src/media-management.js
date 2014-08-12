(function($, window, document, undefined) {

    var pluginName = 'mediaBox';
 
    function Plugin(element, options) {

        this.el = element;

        this.$el = $(element);

        this.options = $.extend({}, $.fn[pluginName].defaults, options);

        this.init();
    }

    Plugin.prototype = {
        
        init: function() {

            var options = this.options,
                id = this.$el.attr('id'),
                $box = this.$el,
                $modal = $('#'+id+'-modal'),
                $dropzone = $modal.find('.drag-and-drop');

            $box.closest('.fileupload-group').find('input').fileupload({
                dataType: 'json',
                dropZone: $box.add($dropzone),
                formData: [
                    {
                        name: 'allow_multiple',
                        value: this.options.allowMultiple,
                    }
                ],
                submit: function(e, data) {
                    $box.removeClass('dragover').find('img').remove();
                    $box.find('.placeholders').hide();
                    $box.find('.progress').show();
                },
                progressall: function (e, data) {
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $box.find('.progress-bar').css(
                        'width',
                        progress + '%'
                    );
                },
                done: function(e, data) {
                    $box.find('.progress').hide();
                    if (options.allowMultiple) {
                        $box.html($box.data('raw'));
                    }
                    $.each(data.result.files, function (index, file) {
                        $('<img/>').attr('src', file.src).appendTo($box);
                        $box.data('raw', $box.html());
                        $box.closest('form').append(file.input);
                        $modal.find('.current-media').append(file.html);
                        $box.mediaBox('updateModal');
                    });
                },
                fail: function(e, data) {
                    alert(data.jqXHR.responseJSON.message);
                },
                stop: function(e, data) {
                    if (options.allowMultiple) {
                        $box.imagesLoaded( function() {
                            $box.mediaBox('update');
                        });
                    }
                    if ($box.find('img').length) {
                        $box.removeClass('empty');
                    }
                }
            });

            $box.click(function(e){
                e.preventDefault();
                $modal.modal();
            });

            $box.add($dropzone)
                .on('dragover', function(e) {
                    $(this).addClass('dragover');
                })
                .on('dragleave drop', function(e) {
                    $(this).removeClass('dragover');
                });

            $dropzone.find('button').click(function(e){
                e.preventDefault();
                $box.closest('.fileupload-group').find('input').click();
            });

            this.update();
        },

        destroy: function() {
            
            this._raw();
            this.$el.removeData();
        },

        update: function() {
            
            this.$el.find('.fileupload-wrapper').hide();
            this._raw();
            this._updateGrid();
            this.$el.find('.fileupload-wrapper').fadeIn('fast');
        },

        remove: function(src) {

            this._raw();
            this.$el.find('img[src="'+src+'"]').first().remove();
            this._store();

            if (!this.$el.find('img').length) {
                this.$el.addClass('empty');
            }
            
            this.update();
        },

        updateModal: function() {
            
            var id = this.$el.attr('id'),
                $modal = $('#'+id+'-modal');

            if (!$modal.find('.media-item').length) {
                $modal.find('.upload-a').tab('show');
                $modal.find('.current-a').closest('li').addClass('hidden');
            } else if ($modal.find('.current-a').closest('li').hasClass('hidden')) {
                $modal.find('.current-a').closest('li').removeClass('hidden');
                $modal.find('.current-a').tab('show');
            }
        },

        _store: function() {

            if (this.options.allowMultiple) {
                this.$el.data('raw', this.$el.html());
            }
        },

        _raw: function() {

            if (this.options.allowMultiple) {
                this.$el.html(this.$el.data('raw'));
            }
        },

        _updateGrid: function() {

            if (!this.options.allowMultiple) {
                return false;
            }
            
            // Reset plugin data, so it inits properly
            this.$el.removeData('plugin_photosetGrid').removeAttr('data-width');
            this.$el.data('raw', this.$el.html());
            var count = this.$el.find('img').length,
                columns = count,
                layout = '';
            if (count % 2 === 0 && count % 3 === 0) {
                columns = 3;
            } else {
                columns = count % 2 === 0 ? 2 : 3;
            }
            var rows = Math.ceil(count/columns);
            for (i = 0; i < rows; i++) {
                layout += count < columns ? count : columns;
                count -= columns;
            }
            this.$el.photosetGrid({
                gutter: '2px',
                layout: layout
            });
        }
    };

    $.fn[pluginName] = function(options) {
        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            return this.each(function() {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            if (Array.prototype.slice.call(args, 1).length === 0 && $.inArray(options, $.fn[pluginName].getters) !== -1) {
                var instance = $.data(this[0], 'plugin_' + pluginName);
                return instance[options].apply(instance, Array.prototype.slice.call(args, 1));
            } else {
                return this.each(function() {
                    var instance = $.data(this, 'plugin_' + pluginName);
                    if (instance instanceof Plugin && typeof instance[options] === 'function') {
                        instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                    }
                });
            }
        }
    };

    $.fn[pluginName].defaults = {
        allowMultiple: false,
    };

})(jQuery, window, document);

$(function() {

    if (typeof handover !== 'undefined' && typeof handover.media !== 'undefined') {
        
        $(handover.media.boxes).each(function(i, media){
            $('#'+media[0]).mediaBox({
                allowMultiple: media[1]
            });
        });

        $(document).on('drop dragover', function(e) {
            e.preventDefault();
        });

        $(document).on('click', '.media-unbind', function(){
            var $item = $(this).closest('.media-item'),
                $current = $item.closest('.current-media'),
                $img = $item.find('img');

            $.post(handover.media.unbind_url+'/'+$(this).data('id'), function(data) {
                
                $item.fadeOut('fast', function(){

                    $item.remove();
                    
                    var slug = $current.closest('.tab-pane').attr('id').replace('-current', ''),
                        $box = $('#'+slug);

                    $box.mediaBox('remove', $img.attr('src'));
                    $box.mediaBox('updateModal');
                });
            });
        });
    }
});