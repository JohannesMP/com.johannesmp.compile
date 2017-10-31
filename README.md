#### A small web-based multi-file compiler: [Live version](http://compile.johannesmp.com/)

- Syntax Highlighting and Text editing provided by [CodeMirror](http://codemirror.net/)
- Compiling backend provided by [Coliru](coliru.stacked-crooked.com)


# Todo

I'd like to add the following, time permitting:

## Bugfixes
- Scrolling problems when close to min-height of editors.
- Occasional errors when adding/removing files repeatedly.
- iOS scaling
- Disable buttons while document is still loading (for low-speed mobile connections)
- General code smell; need to pay of code debt of quick prototyping


## Features
- Feedback on destructive actions (file deletion, window closing)
- Editor Color scheme selection
- Settings menu
    - And the ability to save them (ex. cookie)
- Expanded 
- Support for [gists](gist.github.com)
    - Github OAuth login
    - Github gist API
         - Download files from a provided gist ID and compile them.
         - Gist uploads (require login?)
    - Query string to allow sharing of gists and compiling
    - Embed version for portfolio demos
