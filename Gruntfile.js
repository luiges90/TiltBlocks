module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			build: {
				src: 'tb.js',
				dest: 'build/tb.min.js'
			}
		},
		cssmin: {
			build: {
				src: 'tb.css',
				dest: 'build/tb.min.css'
			}
		},
		copy: {
			build: {
				files: [
					{expand: true, src: ['tb.html'], dest: 'build/', filter: 'isFile'},
					{expand: true, src: ['img/*.png', 'levels/**'], dest: 'build/'},
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('default', ['uglify', 'cssmin', 'copy']);

};