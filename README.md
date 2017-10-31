#### A small web-based multi-file compiler: [Live version](http://compile.johannesmp.com/)

- Syntax Highlighting and Text editing provided by [CodeMirror](http://codemirror.net/) ([Github Repo](https://github.com/codemirror/codemirror))
- Compiling backend provided by [Coliru](coliru.stacked-crooked.com) ([Github Repo](https://github.com/StackedCrooked/coliru))


# Todo

I'd like to work on the following, time permitting:

## Bugs/Fixes
- Scrolling problems when close to min-height of editors
- Occasional errors when adding/removing files repeatedly
- iOS scaling (viewport) 
- iOS scrolling (horizontal not wrapping or scrolling)
- Disable buttons while document is still loading (for low-speed mobile connections)
- General code smell; Need to pay of code debt of quick prototyping


## Features
- Feedback on destructive actions (file deletion, window closing)
- Editor Color scheme selection
- Settings menu
    - And the ability to save them (ex. cookie)
- Other view modes, such as tabbed, or fullscreen.
- Expanded Compiler args
    - Macro definition UI to make composing the final cmd easier
    - Macro highlighting
    - Preview of composed cmd
- Support for [gists](gist.github.com)
    - Github OAuth login
    - Github gist API
         - Download files from a provided gist ID and compile them.
         - Gist uploads (require login?)
    - Query string to allow sharing of gists and compiling
    - Embed version for portfolio demos
- Make Console output also use CodeMirror
    - General bash-style colors
    - Syntax/error highlighting for g++ output
