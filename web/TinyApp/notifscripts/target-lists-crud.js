window.addEventListener('tb_libs_loaded', (event) => {

    $(document).on('loaded_fkeys', function() {
         if($('[name="contact_list_id"]').length > 0) {
            $("[name='contact_list_id'] > option").each(function() {
                  if(this.value == 2)
                  {
                      let arr;
                      arr = this.text.split("(");
                      this.text = arr[0]; 
                  }
            });
         }
    });


    $(document).change('[name="contact_list_id"]', function() {                                                                                                                                                            
        if($('#tb-jfp-form').length > 0 
          && $('#tb-jfp-form').getFormValue() != null 
          && $('#tb-jfp-form').getFormValue().contact_list_id !== null 
          && $('#tb-jfp-form').getFormValue().contact_list_id == 2)                                                                                                                                                       
        {                                                                                                                                                                                                              
            $('[name="skip_contact_list_id"]').prop('disabled', false);                                                                                                                                                           
        }                                                                                                                                                                                                              
        else                                                                                                                                                                                                           
        {                                                                                                                                                                                                              
            $('[name="skip_contact_list_id"]').prop('disabled', true).val("");
        }                                                                                                                                                                                                              

    });  

});
