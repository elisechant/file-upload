// todo - browse options https://github.com/blueimp/jQuery-File-Upload/wiki/Options and source code

// todo - https://github.com/blueimp/jQuery-File-Upload/blob/master/js/jquery.fileupload-validate.js

var HIP = window.HIP || {};

$(function() {

    'use strict';

    /**
     * File Upload Widget
     *
     */

    var componentName = '[data-fileupload]';


    /**
     * @param elSelector {Object} jQuery object
     * @constructor
     */
    HIP.FileUpload = function($el) {
        this.$el = $el;
        this.init();
    };

    HIP.FileUpload.prototype = {

        elSubmit: '[data-fileupload-submit]',
        elPreview: '[data-fileupload-preview]',


        elInputParent: '[data-fileupload-parent]',

        tmplInput: 'Attach files <input data-fileupload type=\"file\" name=\"files[]\" multiple>',



        //uploadUrl: '//jquery-file-upload.appspot.com/',
        uploadUrl: '/upload',


        model: [],

        init: function() {
            this.setup();
            this.initPlugin().initEvents();
        },

        setup: function() {
            debugger;
            $(this.elInputParent).append(this.tmplInput);
        },

        initPlugin: function() {
            var self = this;

            self.$el.fileupload({
                url: self.uploadUrl,
                dataType: 'json',
                autoupload: true,   // must be false to manually submit each file !

                limitConcurrentUploads: 3

                //add: function (e, data) {   // override the add callback!
                //    //https://github.com/blueimp/jQuery-File-Upload/wiki/Submit-files-asynchronously
                //    $.getJSON('/example/url', function (result) {
                //        data.formData = result; // e.g. {id: 123}
                //        data.submit();
                //    });
                //}

            }).prop('disabled', !$.support.fileInput)
                .parent().addClass($.support.fileInput ? undefined : 'disabled');

            return self;
        },

        initEvents: function() {
            this.$el.bind('fileuploadchange', $.proxy(this.onFileuploadchange, this));
            this.$el.bind('fileuploaddragover', $.proxy(this.onFileuploaddragover, this));
            this.$el.bind('fileuploaddrop', $.proxy(this.onFileuploaddrop, this));
            this.$el.bind('fileuploaddone', $.proxy(this.onFileuploaddone, this));

            // I have the files, I am initiating upload
            this.$el.bind('fileuploadadd', $.proxy(this.onFileuploadadd, this));

            this.$el.bind('fileuploadprogress', $.proxy(this.onFileuploadprogress, this));
            this.$el.bind('fileuploadprogressall', $.proxy(this.onFileuploadprogressall, this));
            this.$el.bind('fileuploadfail', $.proxy(this.onFileuploadfail, this))
            ;
        },

        onFileuploadadd: function(e, data) {
            var self = this,
                $preview = $(this.elPreview);

            data.files.forEach(function(file) {
                var node = $('<div>' + file.name + '</div>');
                $(self.elPreview).append(node);
            });
        },

        onFileuploadchange: function(e, data) { // input file trigger

        },
        onFileuploaddragover: function(e, data) {  // dnd trigger
            e.preventDefault();
            // data.files
        },
        onFileuploaddrop: function(e, data) {  // dnd trigger
            e.preventDefault();
            // data.files
            // https://github.com/blueimp/jQuery-File-Upload/wiki/Drop-zone-effects
        },

        onFileuploaddone: function (e, data) {
            $.each(data.result.files, function (index, file) {
                $('<p/>').text(file.name).appendTo('#files');

                if (file.error) {
                    //
                }
            });

        },
        onFileuploadprogress: function(e, data) {
            //debugger;
        },
        onFileuploadprogressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            // todo - change this to an event fileupload:onProgress
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
            );
        },
        onFileuploadfail: function(e, data) {
            $.each(data.files, function (index) {
                var error = $('<span class="text-danger"/>').text('File upload failed.');
                $(data.context.children()[index])
                    .append('<br>')
                    .append(error);
            });
        }

    };


    $(document).on('ready', function construct() {
        if ($(componentName) && $(componentName).length) {
            $(componentName).each(function() {
                new HIP.FileUpload($(this));
            });
        }
    })

}());
