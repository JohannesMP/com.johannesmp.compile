var url = "http://coliru.stacked-crooked.com/compile";

var defaultEditorFile = `
    <div class="form-group clearfix">
      <div class="input-group clearfix">
        <input class="filename form-control">
        <span class="input-group-btn">
          <button class="removefile btn btn-danger">Remove</button>
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
  args    : $("#args"),
  files   : $("#files"),
  addfile : $("#addfile"),
  compile : $("#compile"),
  output  : $("#output"),
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
  }
}

// Editor Data
var data =
{
  args : "g++ -std=c++14 -O2 -Wall -pedantic -Weffc++ -pthread ${cppFiles} && ./a.out",

  // reads in data from editor
  read : function() {
    this.args  = elements.args.val();
    this.files = {};

    for(var i = 1; i <= editor.count; ++i)
    {
      var id = `filecontent_${i}`;
      var container = editor.containers[id];
      var content = container.getValue();
      var filename = $(`#filename_${i}`).val();
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
  elements.compile.click(function(e) {
    e.preventDefault();
    ShowOutput("Waiting for server...");
    Compile();
  });

  elements.addfile.click(function(e) {
    e.preventDefault();
    addEditorFile("filename", "", true);
  })
});

function escapeHTML(input) {
  return $("<div>").text(input).html()
}

function addEditorFile(filename, filecontent, byUser) {
  if(byUser)
    console.log("File added");
  else
    console.log(`File added: ${filename}`);

  ++editor.count;

  // escape for ace
  var content = escapeHTML(filecontent);

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

  // Set up editor container
  editor.containers[contentID] = CodeMirror.fromTextArea(contentElement[0], editor.options);

  var deleteButton = $(element.find(".removefile")[0]);

  deleteButton.click(function(e) {
    e.preventDefault();
    console.log(`File Removed ${filename}`);

    // remove the editor backend
    editor.containers[contentID].toTextArea();
    // remove the mapping
    delete editor.containers[contentID];
    // remove the dom element
    element.remove();
    --editor.count;
  });

  if(byUser)
    $(nameElement).focus().select();
}

function Compile() {
  console.log("Attempting to Compile");

  var payload = BuildCommand(data.read());
  console.log(payload);

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
    var content = input.files[filename].replace(/"/g,`\\"`);
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
