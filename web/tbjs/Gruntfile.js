module.exports = function( grunt ) {

  // load all grunt tasks
  grunt.loadNpmTasks( 'grunt-jsdoc' );


  grunt.initConfig( {
    jsdoc: {
      dist: {
        src: ['src/**/*.js'],
        options: {
          destination: './public/jsdoc/',
          // template: './node_modules/grunt-jsdoc/node_modules/ink-docstrap/template',
          template: './node_modules/minami',
          configure: './jsdoc.json',
        },
      },
    },
  } );

};
