(function() {
  
  ajv.addFormat('name_lat_t', /^[A-Za-z0-9\s\-\.\,\@,\_\*\?\!]+$/);

  ajv.addFormat('name_t', /^\s*\S+\s*$/);
  
  ajv.addFormat('uint', function(val) {
    return (val >= 0);
  });

  ajv.addFormat('unumeric', function(val) {
    return (val >= 0);
  });

  ajv.addFormat('users_birth_date_lim', function(val) {
    var date = new Date(val);
    return (new Date('1900-01-01') <= date && new Date('2100-01-01') >= date);
  });

  // TODO add all custom domains \dD
  
})();
