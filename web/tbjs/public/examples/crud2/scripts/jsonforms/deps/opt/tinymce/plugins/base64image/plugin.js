tinymce.PluginManager.add("base64image", function(editor, f) {
  var imageCountLimit = editor.getParam("max_image_count") || 10;
  var imageSizeLimit = editor.getParam("max_image_size") || 512000;
  var imageHeightLimit = editor.getParam("max_image_size") || 1024;
  var imageWidthLimit = editor.getParam("max_image_size") || 1024;

  ASSERT.ofTbType(imageCountLimit, 'number', 'TinyMCE base64: imageCountLimit %s must be a number', imageCountLimit);
  ASSERT.ofTbType(imageSizeLimit, 'number', 'TinyMCE base64: imageSizeLimit %s must be a number', imageSizeLimit);
  ASSERT.ofTbType(imageHeightLimit, 'number', 'TinyMCE base64: imageHeightLimit %s must be a number', imageHeightLimit);
  ASSERT.ofTbType(imageWidthLimit, 'number', 'TinyMCE base64: imageWidthLimit %s must be a number', imageWidthLimit);

  var encodeImage = function (isBackground) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var imageFile = document.getElementsByName("tb-jf-tinymce-base64-img")[0].files;
      var fileReader = new FileReader();
      for (var i = 0, f; f = imageFile[i]; i++) {
        var fileSize = f.size;
      }

      if ((this).parent() && (this).parent().parent()) {
        var pluginWindow = (this).parent().parent();
      }

      if (fileSize > imageSizeLimit) {
        editor.windowManager.open({
          title: "Error: fileSizee exceeds limits",
          width: 450,
          height: 80,
          html: '<p style="font-size:14px;padding:30px;">The image is too big. It must be 500KB or less.</p>',
          buttons: [
            {
              text: "OK",
              onclick: function() {
                if ((this).parent() && (this).parent().parent()) {
                  (this).parent().parent().close();
                }
              }
            }
          ]
        });
        pluginWindow.close();
        return;
      }

      if ($(editor.getBody()).find('img').length >= imageCountLimit) {
        editor.windowManager.open({
          title: "Error: too many images",
          width: 450,
          height: 80,
          html: '<p style="font-size:14px;padding:30px;">The number of images in the editor cannot be higher than ' + imageCountLimit + '. Please delete an image and try again.</p>',
          buttons: [
            {
              text: "OK",
              onclick: function() {
                if ((this).parent() && (this).parent().parent()) {
                  (this).parent().parent().close();
                }
              }
            }
          ]
        });
        pluginWindow.close();
        return;
      }

      fileReader.onload = function (base64) {
        if (fileSize > imageSizeLimit) {
          return;
        }
        var imgData = base64.target.result;
        var img = new Image();
        img.src = imgData;

        if (img.height > imageHeightLimit || img.width > imageWidthLimit) {
          editor.windowManager.open({
            title: "Error: dimensions exceed limits",
            width: 450,
            height: 80,
            html: '<p style="font-size:14px;padding:30px;">The image cannot be more than ' + imageWidthLimit + ' pixels wide or ' + imageHeightLimit + ' pixels high.</p>',
            buttons: [
              {
                text: "OK",
                onclick: function() {
                  if ((this).parent() && (this).parent().parent()) {
                    (this).parent().parent().close();
                  }
                }
              }
            ]
          });
          pluginWindow.close();
        } else {
          if (isBackground) {
            var edObj = editor.dom.getRoot();
            var text = editor.getContent({format: 'raw'});
            var element = document.createElement('div');
            element.innerHTML = text;

            if (element.querySelector('.tb-jf-tinymce-base64-img-bg')) {
              text = element.querySelector('.tb-jf-tinymce-base64-img-bg').innerHTML;
            }

            var style = 'background-image: url(\'' + imgData + '\');background-repeat: no-repeat; background-position: top center;';

            var html = '<div class="tb-jf-tinymce-base64-img-bg" style="' + style + '">'
              + text
              + '</div>';

            editor.setContent('');
            editor.execCommand('mceReplaceContent', false, html);

          } else {
            editor.execCommand("mceInsertContent", false, "<img src='" + imgData + "' />");
          }
        }
      };

      fileReader.onerror = function (err) {
        ASSERT.isDefined(err, 'TinyMCE error: %s', err.getMessage());
      };

      if (imageFile.length > 0) {
        fileReader.readAsDataURL(imageFile[0]);
      } else {
        editor.windowManager.open({
          title: "Error: no file selected",
          width: 450,
          height: 80,
          html: '<p style="font-size:14px;padding:30px;">Please select a file before clicking the insert button.</p>',
          buttons: [
            {
              text: "OK",
              onclick: function() {
                if ((this).parent() && (this).parent().parent()) {
                  (this).parent().parent().close();
                }
              }
            }
          ]
        });
      }
    } else {
      editor.windowManager.open({
        title: "Error: unsupported browser",
        width: 450,
        height: 80,
        html: '<p style="font-size:14px;padding:30px;">Please use a modern browser.</p>',
        buttons: [
          {
            text: "OK",
            onclick: function() {
              if ((this).parent() && (this).parent().parent()) {
                (this).parent().parent().close();
              }
            }
          }
        ]
      });
    }

    if ((this).parent() && (this).parent().parent()) {
      (this).parent().parent().close();
    }
  };

  editor.addCommand("base64image", function() {
    editor.windowManager.open({
      title: "Insert embedded image",
      width: 450,
      height: 80,
      html: '<input type="file" class="input" name="tb-jf-tinymce-base64-img" style="font-size:14px;padding:30px;" accept="image/png, image/gif, image/jpeg, image/jpg"/>',
      buttons: [
        {
          text: "Insert as image",
          subtype: "primary",
          onclick: function () {
            encodeImage.call(this, false);
          }
        },
        {
          text: "Insert as background",
          subtype: "primary",
          onclick: function () {
              encodeImage.call(this, true);
          }
        },
        {
          text: "Cancel",
          onclick: function() {
            if ((this).parent() && (this).parent().parent()) {
              (this).parent().parent().close();
            }
          }
        }
      ]
    });
  });

  editor.addButton("base64image", {
    cmd: "base64image",
    icon: "image",
    context: "insert",
    title: "Insert embedded image"
  });

  editor.addMenuItem("base64image", {
    cmd: "base64image",
    context: "insert",
    text: "Insert embedded image",
    icon: "image",
    prependToContext: true
  });
});