/**
 * Buddyexpress Desk
 *
 * @package   Bdesk
 * @author    Buddyexpress Core Team <admin@buddyexpress.net
 * @copyright 2014 BUDDYEXPRESS NETWORKS.
 * @license   Buddyexpress Public License http://www.buddyexpress.net/Licences/bpl/
 * @link      http://labs.buddyexpress.net/bdesk.b
 */

tinymce.PluginManager.add("bdesk_photo", function (editor, f) {
/**
* Setup buttons for Bdesk Editor
* @lastchange: $arsalanshah
*/
   editor.addButton("bdesk_photo", {
    icon: 'image',
    title: 'Image Embed Upload',
      cmd: "bdesk_photo"
    });
/**
* Init the plugin
* @lastchange $arsalanshah
*/
  editor.addCommand("trueInsertRawHTML", function (value) {

    this.selection.setContent('tiny_mce_marker');
    editor.setContent(
    editor.getContent().replace(/tiny_mce_marker/g, function () {
    return value;
    }), { format: "raw" }
    );
  });
   editor.addCommand("bdesk_photo", function () {
        editor.windowManager.open({
          //text for dialog
            title: "Embed a image",
            width: 450,
      //location:
            height: 80,
        //we need a to put a base64 encode image into texteditor
            html: '<input type="file" class="input" name="bdesk_image" id="image_embed" style="font-size:14px;padding:30px;" accept="image/x-png, image/gif, image/jpeg"/>',
            buttons: [{
                text: "Insert",
                subtype: "primary",
          /**
          * Triger a OnClick
          * @lastchange: $arsalanshah
          */
               onclick: function () {
                    if (window.File && window.FileReader && window.FileList && window.Blob) {
                        var imagefile = document.getElementsByName("bdesk_image")[0].files;
            var class_filereader = new FileReader();
                         for (var i = 0, f; f = imagefile[i]; i++) {
                                var filesiz = f.size;
                         }
            if(filesiz > 512000){
              alert("The image is big in size. The image must be 500KB or less.");
              (this).parent().parent().close();
            }
            class_filereader.onload = function (base64) {
            imgData = base64.target.result;
            var img = new Image();
                        img.src = imgData;

                        if(img.height > 800 || img.width > 800){
             alert("The image is big in size. The image must be 800x800 in Size");
              (this).parent().parent().close();
            }
            else {
            editor.execCommand("trueInsertRawHTML", false, "<img src='" + imgData + "' />");
            }

                   };
      /**
           * Log errors
           * @lastchange: $arsalanshah
           */
                 class_filereader.onerror = function (err) {
                            console.log("error", err);
                            console.log(err.getMessage());
                  };
                  if (imagefile.length > 0) {
                            class_filereader.readAsDataURL(imagefile[0]);
                  }
          else {
                      alert("No File selected");
                  }}
          else {
                        alert("Please change your browser to modern one");
                  }
                     (this).parent().parent().close();
                }},
        {
                text: "Close",
                onclick: function () {
                             (this).parent().parent().close();
                          }
                }],
        });
    });


/**
* Setup Insert buttons for Bdesk Editor Dialog
* @lastchange: $arsalanshah
*/
     editor.addMenuItem("bdesk_photo", {
        cmd: "bdesk_photo",
        context: "insert",
    text: 'Embed Image',
    icon: 'image',
    });
});
