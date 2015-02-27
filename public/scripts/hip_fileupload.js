var HIP = window.HIP || {};

$(function() {

    'use strict';

    var el              = '[data-fileupload]';
    var elInput         = '[data-fileupload-input]';
    var elDndZone       = '[data-fileupload-dnd]';
    var elPreview       = '[data-fileupload-preview]';

    /**
     * File upload component
     * jQuery File Upload API documentation:
     * https://github.com/blueimp/jQuery-File-Upload/wiki/API
     * @constructor
     */
    HIP.FileUpload = function($el) {
        this.$el = $el;
        this.init();
    };

    HIP.FileUpload.prototype = {

        MAX_FILES: 5,
        MAX_FILESIZE_BYTES: 1000000,

        uploadUrl: '/upload',
        deleteUrl: '/uploaded/files',

        $input: null,
        $dndZone: null,
        $uploadedItems: null,

        /**
         * Models of promise objects which represent files. Standard promise
         * utilities such as done, fail, always etc can be used directly on
         * each item
         * @type {Array.<Promise>}
         */
        model: [],


        init: function() {
            this.$input = this.$el.find(elInput);
            this.$dndZone = this.$el.find(elDndZone);
            this.$uploadedItems = this.$el.find(elPreview);

            this.initPlugin().initEvents();
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
                sequentialUploads: false,   // ? maybe this should be true?
                paramName: 'files[]',
                // The add callback is invoked as soon as files are added to the fileupload
                // widget (via file input selection, drag & drop or add API call).
                add: function(e, data) {
                    e.preventDefault();
                    $.each(data.files, function(idx, file) {

                        self.validate(file).fail(function(msg) {
                            self.fileValidationErrorHandler(msg);
                        }).then(function(file) {
                            file.uploadID = self.model.length + 1;
                            // adding any other metadata we want to send with the request
                            file.user = {
                                id: Math.ceil(Math.random() * 1000000),
                                name: 'Mickey Mouse'
                            };
                            // store the promise object of the created file
                            // and tell the API to consume the file as an uploaded files group
                            // this way upload groups will only ever have one item
                            self.model.push(
                                self.$input.fileupload('send', { files:file })
                            );
                        });
                    });
                },
                // Callback for the start of each file upload request
                send: function(e, data) {
                    data.context = $($.proxy(self.renderItem, self, e, data));
                },
                progress: function(e, data) {
                    var file = data.files[0],
                        oldVal = 0,
                        newVal = 0;

                    var $item = self.$uploadedItems.find('[data-fileupload-itemid=' + file.uploadID + ']');
                    var $itemProgressBar = $item.find('.progress');

                    newVal = Number(data.loaded / data.total * 100);

                    if (oldVal !== newVal) {
                        self.itemProgressHandler($itemProgressBar, Math.floor(newVal));
                        oldVal = newVal;
                    }
                },
                done: function(e, data) {
                    var file = data.files[0];
                    var $item = self.$uploadedItems.find('[data-fileupload-itemid=' + file.uploadID + ']');
                    var $itemProgressBar = $item.find('.progress');
                    self.itemProgressHandler($itemProgressBar, 'complete');
                },
                change: function() {},
                dragover: function(e, data) {
                    $($.proxy(self.addDndClass, self));
                },
                dragleave: function(e, data) {
                    $($.proxy(self.removeDndClass, self));
                },
                drop: function(e, data) {
                    $($.proxy(self.removeDndClass, self));
                }
            }).prop('disabled', !$.support.fileInput);

            return self;
        },

        validate: function(file) {
            var self = this,
                deferred = $.Deferred(),
                message = null;

            if (self.hasMaxFiles(self.model.length + 1)) {
                message = 'There is a limit of ' + self.MAX_FILES + ' files per message. We can' +
                ' only upload the first ' + self.MAX_FILES + ' files provided.';
            } else if (self.hasMaxFileSize(file.size)) {
                message = 'The file you are trying to upload is too large, try a smaller size. ' +
                'Files must be under ' + this.formatFileSize(this.MAX_FILESIZE_BYTES);
            } else {
                message = '';
            }

            if (message && message.length) {
                deferred.reject(message);
            } else {
                deferred.resolve(file);
            }

            return deferred.promise();
        },
        /**
         * Predicate for validating file count
         * @param filesCount {Number}
         * @returns {boolean}
         */
        hasMaxFiles: function(filesCount) {
            return filesCount > this.MAX_FILES;
        },
        /**
         * Predicate for validating file size
         * @param fileSize {Number}
         * @returns {boolean}
         */
        hasMaxFileSize: function(fileSize) {
            return fileSize > this.MAX_FILESIZE_BYTES;
        },
        fileValidationErrorHandler: function(message) {
            alert(message);
        },

        initEvents: function() {
        },

        renderItem: function(e, data) {
            var file = data.files[0],
                self = this;

            var $item = $('<div>', {
                class: 'fileupload__preview__item',
                'data-fileupload-itemid': file.uploadID
            }).append(
                '<div class="name">' + file.name + ' ' + self.formatFileSize(file.size) +  '</div>' +
                '<div class="progress"></div>' +
                '<a class="message"></a>' +
                '<a class="cancel">Cancel</a>' +
                '<a class="delete">Delete</a>'
            );

            $item.on('click', '.cancel', function(e, data) {
                console.log('cancel', file.uploadID);
                self.model[file.uploadID].abort();
            });

            $item.on('click', '.delete', function(e, data) {
                console.log('delete', file.uploadID);
                return $.ajax({
                    url: self.deleteUrl + '/' + file.name,  // todo - string encoding
                    type: 'DELETE',
                    success: function() {
                        $(this).parent().remove();
                    }
                });
            });

            return this.$uploadedItems.append($item);
        },

        addDndClass: function() {
            this.$dndZone.addClass('is-dragging');
        },

        removeDndClass: function() {
            this.$dndZone.removeClass('is-dragging');
        },

        /**
         * @param $el {Object.<jQuery>} the item in scope's progress bar
         * @param value {Number}
         */
        itemProgressHandler: function($el, value) {
            if (typeof value === 'number') {
                $el.text(value + "%");
            } else {
                $el.text(value);
            }
        },

        formatFileSize: function(bytes) {
            if (typeof bytes !== 'number') {
                return '';
            }
            if (bytes >= 1000000000) {
                return (bytes / 1000000000).toFixed(2) + ' GB';
            }
            if (bytes >= 1000000) {
                return (bytes / 1000000).toFixed(2) + ' MB';
            }
            return (bytes / 1000).toFixed(2) + ' KB';
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

