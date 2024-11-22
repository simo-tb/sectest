var viewPanelDoc = document;

function sb(msg)
{
	window.status = msg;
	return true;
}

var fl_insert_clicked = false;

function stat_edit()
 {
    window.status = 'Редакция';
    return true;
 }
function stat_del()
 {
    window.status = 'Изтриване';
    return true;
 }

function stat_print()
 {
    window.status = 'Печат';
    return true;
 }

function stat_portrait()
 {
    window.status = 'Форматиране \'портрет\'';
    return true;
 }

function stat_portraitoff()
 {
    window.status = 'Изход от форматирането';
    return true;
 }

function stat_printoff()
 {
    window.status = 'Изход от печат';
    return true;
 }


function flShowOnSubmit(form)
{
   return true;
}


function flShowGetChecked(form, pk_name)
{
   var checkArray;
   if(typeof(form._fl_ch.length) == 'undefined')
    {
	// ne e masiv
	checkArray = new Array();
        checkArray[0] = form._fl_ch;
    }
   else
    {
	// masiv
        checkArray = form._fl_ch;
    }

   var ret_str = '';

   for(var i=0; i<checkArray.length; i++)
    if(checkArray[i].type == 'hidden' ||
       checkArray[i].checked)
        ret_str += '&' + pk_name + '=' + checkArray[i].value;

   return ret_str;
}


function cacheFormParams(doc)
{
//return "&__tt=1";
   if(doc == null) 
	doc = viewPanelDoc;
   var str = '';
   for(var j=0; j<doc.forms.length && j<1; j++) // dump-i se samo 1 forma,za da ne se smeswat
   {
    var form = doc.forms[j];
    for(var i=0; i<form.elements.length; i++)
    with(form.elements[i])
    {
     if( // type != 'hidden' &&
       type != 'submit' &&
       type != 'button' &&
       type != 'reset'  &&
       name != ''  )
      {	
	//alert(name);
         if(type == 'radio')
         {
           if(checked)
	    str += '&' + name + '=' + encodeURI(value);
         }
         else
         {
         str += '&' + name + '=';
         if(type.indexOf('select') != -1)
	  { 
            // select box (one&multiple)
	    if(selectedIndex >= 0)
            {
             str += options[selectedIndex].value;
             if(type == 'select-multiple')
               for(var opt=selectedIndex+1; opt<options.length; opt++)
                 if(options[opt].selected)
                  {
	           str += '&' + name + '=' + encodeURI(options[opt].value);
                  }
            }
          }
	 else 
          if(type == 'checkbox')
           {
            if(checked)
	      str += encodeURI(value);
           }
          else
           if(value != '')
             str += encodeURI(value);
         }
     }
     }
   }
//alert(str)
   return str;
}


function openHelp(helpURL)
{
   var w = window.open(helpURL, 'ius_help','directories=no,location=no,menubar=no,toolbar=yes,scrollbars=yes,width=300,height=450,status=yes,resizable=yes' );
   w.focus();
}

function submitResult(formSelector)
{
    var rv = true;
    if ( $(formSelector).find(".json-forms-input").length > 0 )
    {  
        $(formSelector).find( ".json-forms-input" ).each(function(){
            var childrenObj = this.id;
            var extractResult = window[childrenObj].extract();
            if(extractResult)
            {  
                rv = true;
//            return false;
            }  
                else
            {  
                return rv = false;
            }

        });
    }
    else
    {  
        rv = true;
    }
    console.log("SubmitResult return value: ",rv);
    return rv;
}
