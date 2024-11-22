this["JST"] = this["JST"] || {};

this["JST"]["app/scripts/templates/application.ejs"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<p>Your content here.</p>\n';

}
return __p
};

this["JST"]["app/scripts/templates/components.ejs"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div id="modules-tabs" class="navbar">\n  <ul class="nav nav-tabs">\n    ';
 for(var i = 0, l = modules.length; i < l; i++) { ;
__p += '\n    <li role="presentation">\n        <a href="#modules/' +
((__t = ( modules[i].name )) == null ? '' : __t) +
'/edit">\n            ' +
((__t = ( modules[i].name )) == null ? '' : __t) +
' <span id="module-badge-' +
((__t = ( modules[i].name ? modules[i].name.replace(/ /g, '_') : '' )) == null ? '' : __t) +
'" class="badge"> ' +
((__t = ( modules[i].notTranslated )) == null ? '' : __t) +
' </span>\n        </a>\n    </li>\n    ';
 } ;
__p += '\n  </ul>\n</div>\n\n';
 if(showApprove) { ;
__p += '\n<div class="row">\n    <div class="col-md-12">\n        <div class="jumbotron tb-ls-modules-meta">\n            <h3>Approved languages for ' +
((__t = ( currentModule.name )) == null ? '' : __t) +
'</h3>\n            <p>\n                I approve translation in following languages:\n            </p>\n\n            <ul>\n                ';
 for(var i = 0, l = locales.length; i < l; i++) { ;
__p += '\n                ';
 if(locales[i].isChecked) { ;
__p += '\n\n                <li>\n                    <label>\n                        <input type="checkbox" class="locale-approve" name="approve-language-' +
((__t = ( locales[i].language )) == null ? '' : __t) +
'" value="' +
((__t = ( locales[i].language )) == null ? '' : __t) +
'"\n                        ' +
((__t = ( currentModuleMeta.locale_attributes[ locales[i].locale ].is_approved ? 'checked="checked"' : '' )) == null ? '' : __t) +
'\n                        ' +
((__t = ( !canApprove ? 'disabled="disabled"' : '' )) == null ? '' : __t) +
'  />\n                        ' +
((__t = ( locales[i].language_name )) == null ? '' : __t) +
'\n                        <!-- (' +
((__t = ( currentModule.notTranslatedByLocale[ locales[i].locale ] )) == null ? '' : __t) +
' not translated) -->\n                        <span class="' +
((__t = ( (currentModuleMeta.locale_attributes[ locales[i].locale ].is_approved && currentModuleMeta.locale_attributes[ locales[i].locale ].approved_at) ? '' : 'hidden' )) == null ? '' : __t) +
'">\n                            (by\n                             <span class="tb-ls-' +
((__t = ( locales[i].locale )) == null ? '' : __t) +
'-approved-by">' +
((__t = ( currentModuleMeta.locale_attributes[ locales[i].locale ].approved_by  )) == null ? '' : __t) +
'</span>\n                             at\n                             <span class="tb-ls-' +
((__t = ( locales[i].locale )) == null ? '' : __t) +
'-approved-at">' +
((__t = ( currentModuleMeta.locale_attributes[ locales[i].locale ].approved_at  )) == null ? '' : __t) +
'</span>\n                             )\n                        </span>\n                        ';
 if(canImport) { ;
__p += '\n                        <button type="button" class="btn btn-default btn-sm tb-ls-btn-export-file" data-locale="' +
((__t = ( locales[i].locale )) == null ? '' : __t) +
'" data-module="' +
((__t = ( currentModule.name )) == null ? '' : __t) +
'">\n                            Export *.po file\n                        </button>\n                        ';
 } ;
__p += '\n                    </label>\n                </li>\n\n                ';
 } ;
__p += '\n                ';
 } ;
__p += '\n            </ul>\n\n            ';
 if(canApprove) { ;
__p += '\n            <button type="button" class="btn btn-lg btn-primary tb-ls-approve" data-module="' +
((__t = ( currentModule.name )) == null ? '' : __t) +
'">Approve!</button>\n            <!-- <button type="button" class="btn btn-lg btn-default tb-ls-export-pot" data-module="' +
((__t = ( currentModule.name )) == null ? '' : __t) +
'">Export *.pot file</button> -->\n            ';
 } ;
__p += '\n\n        </div>\n    </div>\n</div>\n\n';
 } ;
__p += '\n\n<h1>\n    Strings of ' +
((__t = ( currentModule.name )) == null ? '' : __t) +
'\n\n    <div class="tb-ls-save-state">\n        <em class="tb-ls-save-state-saving">Saving...</em>\n        <em class="tb-ls-save-state-saved">All changes are saved</em>\n        <em class="tb-ls-save-state-retrying">Error while saving changes, retrying...</em>\n    </div>\n</h1>\n\n<div id="spreadsheet"></div>\n';

}
return __p
};

this["JST"]["app/scripts/templates/dashboard.ejs"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class="row">\n    <div class="col-md-12">\n        <div class="jumbotron table-responsive ls-dashboard-panel">\n            <h3>Status</h3>\n\n            <table class="table">\n                <thead>\n                    <tr>\n                        <th></th>\n\n                        ';
 for(var i = 0, l = locales.length; i < l; i++) { ;
__p += '\n\n                        <th>\n                            ' +
((__t = ( locales[i].language_name )) == null ? '' : __t) +
'\n                        </th>\n\n                        ';
 } ;
__p += '\n\n                        <th>\n                            <span>Total</span>\n                        </th>\n                    </tr>\n                </thead>\n\n                ';
 for(var i = 0, l = modules.length; i < l; i++) { ;
__p += '\n\n                <tbody>\n                    <tr>\n                        <td>\n                            <a href="#/modules/' +
((__t = ( modules[i].name )) == null ? '' : __t) +
'/edit">' +
((__t = ( modules[i].name )) == null ? '' : __t) +
'</a>\n                        </td>\n\n                        ';
 for(var j = 0, ll = locales.length; j < ll; j++) { ;
__p += '\n\n                            <td>\n                                ';
 if(modules[i].notTranslatedByLocale[ locales[j].locale ] > 0) { ;
__p += '\n\n                                <span class="label label-warning">\n                                  Not translated:\n                                  ' +
((__t = ( modules[i].notTranslatedByLocale[ locales[j].locale ] )) == null ? '' : __t) +
'\n                                </span>\n\n                                ';
 } else { ;
__p += '\n\n                                <span class="label label-success">\n                                  Everything is translated\n                                </span>\n\n                                ';
 } ;
__p += '\n\n                                ';
 if(modulesMeta[i].locale_attributes[ locales[j].locale ].is_approved) { ;
__p += '\n\n                                    <span class="label label-success">\n                                      Approved\n                                    </span>\n\n                                ';
 } else { ;
__p += '\n\n                                    <span class="label label-danger">\n                                      Not approved\n                                    </span>\n\n                                ';
 } ;
__p += '\n                            </td>\n\n                        ';
 } ;
__p += '\n\n                        <td>\n                            ';
 if(modules[i].notTranslated > 0) { ;
__p += '\n\n                                <span class="label label-warning">\n                                  Not translated:\n                                  ' +
((__t = ( modules[i].notTranslated )) == null ? '' : __t) +
'\n                                </span>\n\n                            ';
 } else { ;
__p += '\n\n                                <span class="label label-success">\n                                  Everything is translated\n                                </span>\n\n                            ';
 } ;
__p += '\n\n                             <span class="label label-default">\n                                Total:\n                                 ' +
((__t = ( modules[i].totalStrings )) == null ? '' : __t) +
'\n                             </span>\n                        </td>\n                    </tr>\n                </tbody>\n\n                ';
 } ;
__p += '\n            </table>\n        </div>\n    </div>\n</div>\n\n';

}
return __p
};

this["JST"]["app/scripts/templates/help.ejs"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<h1>\n\tРабота с интерфейса</h1>\n<h2>\n\tИзисквания</h2>\n<ul>\n\t<li>\n\t\tБраузър\n\t\t<ul>\n\t\t\t<li>\n\t\t\t\tMozilla Firefox 30+</li>\n\t\t\t<li>\n\t\t\t\tGoogle Chrome/Chromium 30+</li>\n\t\t\t<li>\n\t\t\t\tSafari 8+</li>\n\t\t\t<li>\n\t\t\t\tOpera 15+</li>\n\t\t</ul>\n\t</li>\n\t<li>\n\t\tВключен javascript</li>\n</ul>\n<h2>\n\tНачин на работа</h2>\n<ol>\n\t<li>\n\t\tЗарежда се указания URL адрес в браузъра.</li>\n\t<li>\n\t\tИзбира се от менюто в заглавната лента &quot;Модели&quot;.</li>\n\t<li>\n\t\tИзбира се модел, чиито стрингове трябва да бъдат преведени, които са изброени като табове в интерфейса.</li>\n\t<li>\n\t\tОтворената електронна таблица съдържа 1 + N колони, където N е броят езици, които се поддържат.\n\t\t<ul>\n\t\t\t<li>\n\t\t\t\tПървата колона са стринговете. Всеки стринг е текст на английски, който е близко до английския превод, но с технически обозначения в него. Съдържанието в тази колона не може да се променя.</li>\n\t\t\t<li>\n\t\t\t\tСледващите колони са отделните езици. Всяка клетка може да се редактира. Празното място преди и след текста не се запазват.</li>\n\t\t</ul></li>\n\t<li>\n\t\tКогато превеждането приключи, в горния десен ъгъл се натиска бутона "Запиши", за да бъдат перманентно приложени промените.</li>\n</ol>\n';

}
return __p
};

this["JST"]["app/scripts/templates/import.ejs"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<form id="tb-ls-import-form" class="form-horizontal" enctype="multipart/form-data">\n<!--   <div class="form-group">\n    <label for="tb-ls-import-action" class="col-sm-2 control-label">Action</label>\n    <div class="col-sm-10">\n      <select name="action" id="tb-ls-import-action" class="form-control">\n        <option></option>\n        <option value="replace">Replace existing keys</option>\n        <option value="replace">Only insert not existing keys</option>\n      </select>\n    </div>\n  </div> -->\n  <div class="form-group">\n    <label for="tb-ls-import-file" class="col-sm-2 control-label">Import file</label>\n    <div class="col-sm-10">\n      <input type="file" name="import-file" id="tb-ls-import-file" placeholder="Import file" style="display: inline-block;">\n      <button type="submit" id="tb-ls-import-submit" class="btn btn-primary" disabled="disabled">Import</button>\n    </div>\n  </div>\n\n\n  <div id="tb-ls-import-meta" class="hidden">\n    <div class="form-group">\n      <label class="col-sm-2 control-label">Module</label>\n      <div class="col-sm-10">\n        <span id="tb-ls-import-module" style="line-height: 2.1rem"></span>\n      </div>\n    </div>\n    <div class="form-group">\n      <label class="col-sm-2 control-label">Language</label>\n      <div class="col-sm-10">\n        <span id="tb-ls-import-language" style="line-height: 2.1rem"></span>\n      </div>\n    </div>\n\n\n\n    <div id="tb-ls-import-spreadsheet"></div>\n  </div>\n\n\n\n\n</form>\n';

}
return __p
};

this["JST"]["app/scripts/templates/languagesDropdown.ejs"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 for(var i = 0, l = languages.length; i < l; i++) { ;
__p += '\n<li role="presentation">\n  <a role="menuitem" tabindex="-1">\n    <label>\n      <input type="checkbox" value="' +
((__t = ( languages[i].language )) == null ? '' : __t) +
'" ' +
((__t = ( (languages[i].isChecked) ? 'checked="checked"' : '' )) == null ? '' : __t) +
' />\n      ' +
((__t = ( languages[i].language_name )) == null ? '' : __t) +
'\n    </label>\n  </a>\n</li>\n';
 } ;
__p += '\n';

}
return __p
};
