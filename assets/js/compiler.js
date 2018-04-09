var url = "http://coliru.stacked-crooked.com/compile";

var defaultEditorFile = `
    <div class="form-group clearfix">
      <div class="input-group clearfix">
        <input class="filename form-control">
        <span class="input-group-append">
          <button class="removefile btn btn-danger" type="button">Remove</button>
        </span>
      </div>
      <div class="contentwrapper clearfix">
        <textarea class="filecontent"></textarea>
      </contentwrapper
    </div>
    `

// Dom Elements
var elements =
{
  gistfield: $("#gist-field"),
  gistform:  $("#gist-form"),
  fileform:  $("#file-form"),
  args:      $("#args"),
  files:     $("#files"),
  addfile:   $("#addfile"),
  compile:   $("#compile"),
  reset:     $("#gist-reset"),
  savebtn:   $("#gist-save"),
  output:    $("#output"),
};

// Editor Objects
var editor = 
{
  containers : {},
  count : 0,

  // CodeMirror options
  options : 
  {
    lineNumbers: true,
    mode:  "text/x-c++src",
    theme: "material",
    autoCloseBrackets: true,
    matchBrackets: true,
    showCursorWhenSelecting: true,
    indentUnit: 4,
    tabSize: 4,
    keyMap: "sublime",
    rulers: [{ color: "rgba(255,255,255,0.15)", column: 80, lineStyle: "dashed" }],
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
  }
}

// Editor Data
var data =
{
  args : "g++ -std=c++14 -O2 -Wall -pedantic -Weffc++ -pthread ${cppFiles} && ./a.out; echo Returned: $?",

  // reads in data from editor
  read : function() {
    this.args  = elements.args.val();
    this.files = {};

    console.log(editor);

    for(var key in editor.containers)
    {
      var container = editor.containers[key];
      var content = container.getValue();
      var filename = container.getfilename();
      this.files[filename] = content;
    }

    return this;
  },

  // writes data to editor
  write : function() {
    elements.args.val(this.args);
    elements.files.html("");
    for(var filename in this.files)
    {
      var content = this.files[filename];
      addEditorFile(filename, content);
    }
  }
}


$(document).ready(function() {

  ReadFromLocalStorage(false);

  data.write();

  const gist_pattern = elements.gistfield.attr("pattern");

  elements.gistform.submit( (e) => {
    e.preventDefault();
    let id = elements.gistfield.val();
    SetURLGistID(id);
    UpdateEditorWithGist(id);
  });

  elements.fileform.submit( (e) => {
    e.preventDefault();
  })

  elements.reset.click( (e) => {
    localStorage.clear();
    window.location = getPathFromUrl(window.location.href);
  })

  elements.savebtn.click( (e) => {
    PostNewGistData("TestDescription", 
      {
        "file1.txt" : { "content" : "file 1 content"},
        "file2.txt" : { "content" : "file 2 content"},
      }
    )
    .then(
      (vals)    => { console.log("UPLOAD SUCCESS", vals); },
      (reasons) => { console.log("UPLOAD FAILURE", reasons); }
    );
  })

  // Form input validation
  elements.gistfield.on("invalid", (event) => {
    event.target.setCustomValidity("Enter a valid Gist ID (32 hex characters)");
  });

  elements.gistfield.on("input", (event) => {
    let old_val = elements.gistfield.val();

    let slash_pos = old_val.lastIndexOf("/");
    if(slash_pos != -1)
    {
      let new_val = old_val.substring(slash_pos+1);

      elements.gistfield.focus();
      elements.gistfield.val(new_val);
      return;
    }
    event.target.setCustomValidity(""); 
    event.target.removeAttribute("pattern");
  });

  elements.gistfield.on("change", (event) => {
    let slash_pos = elements.gistfield.val().lastIndexOf("/")
    event.target.setAttribute("pattern", gist_pattern);
  });


  elements.compile.click(function(e) {
    e.preventDefault();
    ShowOutput("Waiting for server...");
    Compile();
  });

  elements.addfile.click(function(e) {
    // Ensure that gitst ID is empty, both in field and in query string
    elements.gistfield.val("");
    SetURLGistID();

    SaveToLocalStorage();

    e.preventDefault();
    addEditorFile("filename", "", true);
  });

  // Get id from query string
  let gist_id = GetQueryParam("gist");
  if(gist_id !== null && gist_id.length === 32) {
    elements.gistfield.val(gist_id);
    UpdateEditorWithGist(gist_id);
  } else {
    SetURLGistID();
  }
});

function escapeCodeMirrorHTML(input) {
  return $("<div>").text(input).html()
}

function addEditorFile(filename, filecontent, byUser) {
  if(byUser)
    console.log("File added");
  else
    console.log(`File added: ${filename}`);

  ++editor.count;

  // escape for codemirror
  var content = escapeCodeMirrorHTML(filecontent);

  var element = $(`<div class="file"></div>`)
  element.html(defaultEditorFile);
  elements.files.append(element);

  var nameElement = $(element.find(".filename")[0]);
  nameElement.val(filename);
  var nameID = `filename_${editor.count}`;
  nameElement.attr('id', nameID);

  var contentElement = $(element.find(".filecontent")[0])
  contentElement.html(content);
  var contentID = `filecontent_${editor.count}`
  contentElement.attr('id', contentID);

  contentElement.submit( (e) => {
    console.log("SUBMIT");
  })

  // Set up editor container
  editor.containers[contentID] = CodeMirror.fromTextArea(contentElement[0], editor.options);
  editor.containers[contentID]["getfilename"] = () => {
    return nameElement.val();
  }

  var deleteButton = $(element.find(".removefile")[0]);

  deleteButton.mouseup(function(e) {
    e.preventDefault();
    console.log(`File Removed ${filename}`);

    var key = e.which;
    console.log("KEY", key);
    if(key == 13)  // the enter key code
    {
      console.log("HIT ENTER!");
    }

    // Ensure that gitst ID is empty, both in field and in query string
    elements.gistfield.val("");
    SetURLGistID();

    // remove the editor backend
    editor.containers[contentID].toTextArea();
    // remove the mapping
    delete editor.containers[contentID];
    // remove the dom element
    element.remove();

    // Update the stored data in the backend
    SaveToLocalStorage();
  });

  if(byUser)
    $(nameElement).focus().select();
}

function Compile() {
  console.log("Attempting to Compile");

  var payload = BuildCommand(data.read());
  console.log(payload);
  SaveToLocalStorage(false);

  $.post({
      url: url,
      crossDomain: true,
      data: JSON.stringify(payload),
  })
  .done(ShowSuccess)
  .fail(ShowError);
}

// Construct the command to be executed on the server
function BuildCommand(input) {
  var fileEcho = "";
  var cppFiles = "";

  for(var filename in input.files) {
    var content = input.files[filename];
    // escaping backslashes
    
    content = content.replaceAll(String.fromCharCode(92),String.fromCharCode(92,92));
    // escaping strings
    content = content.replace(/"/g,`\\"`);

    fileEcho += `echo "${content}">>${filename}&&`;
    if(filename.endsWith(".cpp"))
      cppFiles += `${filename} `;
  };

  compileArgs = input.args.replace("${cppFiles}", cppFiles);

  return { "cmd" : `${fileEcho} ${compileArgs}` };
}

function ShowOutput(output) {
  elements.output.html(output);
}

function ShowSuccess(reply) {
  console.log("OUTPUT: " + reply);
  ShowOutput(reply);
}

function ShowError(err) {
  console.error(err);
  ShowOutput(err);
}

function UpdateEditorWithGist(id) {
  console.log(`loading gist ${id}`);
  
  FetchGistData(id)
    .then(
      (vals)    => {         
        data.files = {}
        for(let key in vals.files)
        {
          let file = vals.files[key];
          data.files[file.filename] = file.content;
        }
        data.write();
        SaveToLocalStorage(false);
      },
      (reasons) => { console.log("FAILURE", reasons);}
    );
}

function ReadFromLocalStorage(write_data)
{
  if (typeof(Storage) === "undefined") return;
  if(localStorage["compile-data"])
  {
    var loaded = JSON.parse(localStorage["compile-data"]);
    data.args = loaded.args;
    data.files = loaded.files;
    // defaults to true if not provided
    if(write_data === undefined || write_data === true) data.write();
  }
}

function SaveToLocalStorage(read_data)
{
  // defaults to true if not provided
  if(read_data === undefined || read_data === true) data.read();

  if (typeof(Storage) === "undefined") return;
  localStorage["compile-data"] = JSON.stringify(data);

  console.log("SAVED TO LOCAL STORAGE: ", localStorage["compile-data"]);
}


// Query string logic
function SetURLGistID(id) {
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    if(id !== undefined && id !== "") 
    {
      newurl = `${newurl}?gist=${id}`;
    }
    window.history.replaceState({path:newurl},'',newurl);
  }
}

// returns the base path from url without hash or query string
function getPathFromUrl(url) {
  return url.split(/[?#]/)[0];
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
