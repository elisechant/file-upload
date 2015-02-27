var HIP = window.HIP || {};

$(function() {

    'use strict';

    var el              = '[data-fileupload]';
    var elInput         = '[data-fileupload-input]';
    var elDndZone       = '[data-fileupload-dnd]';
    var elPreview       = '[data-fileupload-preview]';
    var elGlobalProgressBar   = '[data-fileupload-globalprogress]';


    HIP.FileUpload = function($el) {
        this.$el = $el;
        this.init();
    };

    HIP.FileUpload.prototype = {

        uploadUrl: '/upload',
        deleteUrl: '/uploaded/files/',

        $input: null,
        $preview: null,
        $dndZone: null,
        $globalProgressBar: null,

        counter: 0,

        init: function() {
            this.$input = this.$el.find(elInput);
            this.$preview = this.$el.find(elPreview);
            this.$dndZone = this.$el.find(elDndZone);
            this.$globalProgressBar = this.$el.find(elGlobalProgressBar);

            this.initPlugin();
            this.initPluginEvents();

        },

        initPlugin: function() {
            var self = this;
            self.$input.fileupload({
                url: self.uploadUrl,
                dataType: 'json',
                dropZone: $(document),    // allow the user to drop the file anywhere, assume only one drop zone on a page
                autoupload: true,
                singleFileUploads: false,
                progressInterval: 1,
                bitrateInterval: 1,
                sequentialUploads: true,
                paramName: 'files[]'
            }).prop('disabled', !$.support.fileInput);
        },

        initPluginEvents: function() {
            // I am a user interacting with the file input button
            this.$input.bind('fileuploadchange', $.proxy(this.onFileuploadchange, this));
            // I am a user interacting with the DND
            // https://github.com/blueimp/jQuery-File-Upload/wiki/Drop-zone-effects
            this.$input.bind('fileuploaddragover', $.proxy(this.onFileuploaddragover, this));
            this.$input.bind('fileuploaddragleave', $.proxy(this.onFileuploaddragleave, this));
            this.$input.bind('fileuploaddrop', $.proxy(this.onFileuploaddrop, this));

            // I have the file or files for this file upload, I am initiating upload
            this.$input.bind('fileuploadadd', $.proxy(this.onFileuploadadd, this));
            // I have initiated my upload and I am observing the progress of my upload object
            this.$el.bind('fileuploadprogress', $.proxy(this.onFileuploadprogress, this));
            this.$el.bind('fileuploadprogressall', $.proxy(this.onFileuploadprogressall, this));

            // uploads are completed
            this.$el.bind('fileuploaddone', $.proxy(this.onFileuploaddone, this));
            this.$el.bind('fileuploadfail', $.proxy(this.onFileuploadfail, this));
        },

        onFileuploadadd: function(e, data) {
            var self = this;
            e.preventDefault();    // stop the plugin automatically submitting

            if (self.counter >= 5) {
                console.log('Maximum of 5 uploads per message');
                return false;
            }

            // todo - bug with multi file uploads - need to recusively call plugin on each file to overcome stupid plugin
            $.each(data.files, function(idx, file) {
                self.counter++;
                file.uploadID = self.counter;   // store an id so we can reference the item later

                self.$input.fileupload('send', {files:file});

                data.context = $($.proxy(self.renderItem, self, {
                    file: file,
                    data: data
                }));
            });
        },

        onFileuploadchange: function(e, data) {
        },
        onFileuploaddragover: function(e, data) {
            $($.proxy(this.addDndClass, this));
        },
        onFileuploaddragleave: function(e, data) {
            $($.proxy(this.removeDndClass, this));
        },
        onFileuploaddrop: function(e, data) {
            $($.proxy(this.removeDndClass, this));
        },

        onFileuploadprogress: function(e, data) {
            var file = data.files[0];
            var oldVal = 0,
                newVal = 0;

            var $itemProgress = this.$preview.find('[data-fileupload-itemid=' + file.uploadID + ']').find('.item-progress');

            newVal = Number(data.loaded / data.total * 100);

            if (oldVal !== newVal) {
                if (newVal > 1) {
                    $itemProgress.text(Math.floor(newVal) - 1  + "%");
                }
                oldVal = newVal;
            }
        },

        onFileuploadprogressall: function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            this.$globalProgressBar.text(progress + '%');
            $(document).trigger('fileupload:complete')
        },

        onFileuploaddone: function(e, data) {
            var file = data.files[0];
            var $item = this.$preview.find('[data-fileupload-itemid=' + file.uploadID + ']');
            var $itemProgress = $item.find('.item-progress');
            $itemProgress.text('100%');
        },

        onFileuploadfail: function(e, data) {
            var file = data.files[0];
            var $item = this.$preview.find('[data-fileupload-itemid=' + file.uploadID + ']');
            var $itemProgress = $item.find('.item-progress');
            $itemProgress.text('Error');
        },


        renderItem: function(data) {
            var file = data.file;
            var jqueryObj = data.data;

            var $item = $('<div>', {
                class: 'fileupload__preview__item',
                'data-fileupload-itemid': file.uploadID
            }).append(
                file.name +
                '<div class=\"item-progress\"></div>' +
                '<div class=\"item-icon\"></div>' +
                '<div class=\"item-cancel\">Cancel</div>' +
                '<div class=\"item-delete\">Delete</div>'
            );

            $item.on('click', '.item-cancel', function() {
                debugger;
                jqueryObj.abort();
            });

            $item.on('click', '.item-delete', function() {
                $.ajax({
                    url: self.deleteUrl + file.name,
                    type: 'DELETE',
                    success: function() {
                        $(this).parent().remove();
                    }
                });
            });

            return this.$preview.append($item).append('<br>');
        },

        addDndClass: function() {
            this.$dndZone.addClass('is-dragging');
        },

        removeDndClass: function() {
            this.$dndZone.removeClass('is-dragging');
        }

    };

    $(document).on('ready', function construct() {
        if ($(el) && $(el).length) {
            $(el).each(function() {
                new HIP.FileUpload($(this));
            });
        }
    })


}());

