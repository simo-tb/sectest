let $form = $('#tb-jfp-form');

$form.on('tb_jfp_loading_finish', () => {
  let contactListsSelect = $("select[name='recipients/contact_list_id']");

  ASSERT(contactListsSelect[0] != null);

  let recipientsListDescr = $("div[data-tb-jf-type][name='recipients/recipients'] .tb-jf-description");

  ASSERT(recipientsListDescr != null);

  recipientsListDescr.append("<br><br><span id='extra-description-recipients-list'></span>");

  replaceContentInRecipientsListDescription(contactListsSelect);

  contactListsSelect.on("change", function () {
    replaceContentInRecipientsListDescription($(this));
  });

  function replaceContentInRecipientsListDescription(contactListsSelect) {
    ASSERT(contactListsSelect != null, "No <select> element for contact lists is given!", contactListsSelect);

    let contactListsValue = contactListsSelect[0].selectize.getValue();
    
    ASSERT(contactListsValue != null);

    let tree = $form.data('tbJfTree');
    
    ASSERT(tree != null);

    let contactListsData = tree.formDesc.resources.notification_templates_contact_lists_vw.records;

    ASSERT(contactListsData != null && Array.isArray(contactListsData));

    contactListsData.forEach( contactList => {
      ASSERT(contactList.data != null, "Missing data property for the selected contact", contactList);
      ASSERT(contactList.data.id != null, "Missing ID in contact data", contactList);

      if (contactList.data.id == contactListsValue) {
        contactList.data.descr = contactList.data.descr || "";

        let recipientsListDescr = $("div[data-tb-jf-type][name='recipients/recipients'] .tb-jf-description #extra-description-recipients-list");

        ASSERT(recipientsListDescr != null);

        recipientsListDescr.html(contactList.data.descr);
      }
    });
  }
});

