
function tbUtilsFunc() {
        if(typeof window.tbUtilsCalled !== 'undefined') {
            return;
        }

        window.tbUtilsCalled = true; 
        autocompleteOffFunc();

        var isTBUProcessed = false;

        const observer = new MutationObserver(mutation => {
          if(!isTBUProcessed) {
            console.log("DOM Changed, autocomplete off");
            autocompleteOffFunc();
            isTBUProcessed = true;
          }
        });

        observer.observe(document, {
          childList: true,
          attributes: true,
          subtree: true,  
          characterData: true
        });


        setInterval(function(){
          isTBUProcessed = false;
        }, 1000);
}

function autocompleteOffFunc() {
	document.querySelectorAll('form')
	  .forEach((form) => {
		  if(!form.hasAttribute('autocomplete'))
		  { 
			form.setAttribute( "autocomplete", "off");
		  }
		  if(!form.hasAttribute('autocapitalize'))
		  {
			form.setAttribute("autocapitalize", "none");
		  }
		  if(!form.hasAttribute('spellcheck'))
		  {
			form.setAttribute("spellcheck", "false")
		  }
		  if(!form.hasAttribute('autocorrect'))
		  {
			form.setAttribute("autocorrect", "off");
		  }
	  });
}

tbUtilsFunc();



