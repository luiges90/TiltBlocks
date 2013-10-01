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
		processhtml: {
			build: {
				files: {
					'build/index.html': 'tb.html'
				}
			}
		},
		copy: {
			build: {
				files: [
					{expand: true, src: ['lib/jquery.jscrollpane.css'], dest: 'build/'},
					{expand: true, src: ['img/*.png', 'levels/**'], dest: 'build/'},
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-processhtml');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('default', ['uglify', 'cssmin', 'processhtml', 'copy']);

};