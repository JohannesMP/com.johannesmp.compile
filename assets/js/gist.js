const gist_api_url = "https://api.github.com/gists";

// Returns promise that, Given a base16 gist id, results in all relevant data
// - if a file returned is truncated will attempt to fetch it
// - optionally provide a load_callback which is called when truncated files need to be fetched
const FetchGistData = (id) => {
  return new Promise( 
    (resolve, reject) => {
      console.log("requesting load of gist", id);

      $.get({ url: `${gist_api_url}/${id}`,})
        .done(reply => {
          console.log(`Got reply for gist '${id}'`);
          FillTruncatedGists(reply, resolve);
        }).fail(reject);
    }
  );
}

// Github API returns content of all files in gist but some may be truncated.
// For a given Github API reply, fetches and fills in content of all truncated files.
const FillTruncatedGists = (data, callback) => {
  let files    = data["files"]; // reference to "files" objects
  let to_fetch = {};            // Files that still need to be fetched

  for (var key in files) {
    if(files[key]["truncated"])
    {
      console.log(`file ${key} was truncated. Fetching full content`);
      to_fetch[key] = files[key]["raw_url"];
    }
  }

  let to_fetch_count = Object.keys(to_fetch).length;

  // All complete, no need to async fetch
  if(to_fetch_count === 0)
  {
    console.log("No files were truncated, so nothing more to fetch");
    callback(data);
    return;
  }

  // Use promises to GET content of each file
  let promises = [];
  for(let filename in to_fetch) {
    let url = to_fetch[filename];
    let promise = new Promise( (resolve, reject) => {
      $.get(url)
        .done( res => { resolve([filename, res]); } )
        .fail( err => {  reject([filename, err]); } );
    });
    promises.push(promise);
  }

  // Run promises and when all are done, fill in fetched files in data object
  Promise.all(promises).then( 
    // Success
    (vals) => {
      for(let item in vals)
      {
        filename = vals[item][0];
        files[filename]["truncated"] = false;
        files[filename]["content"] = vals[item][1];
      }
      console.log(`All ${to_fetch_count} truncated files have been fetched`);
      callback(data);
    }, 
    // Error
    (reason) => {
      console.error("Error fetching truncated files:");
      console.error(reason);
      callback(data);
    }
  );
};


const PostNewGistData = (description, files) => {
  return new Promise( 
    (resolve, reject) => {
      console.log("requesting creation of new gist");

      $.post({
          url: `${gist_api_url}`,
          data: {
            "files" : files,
            "description" : description,
            "public" : false,
          }
        })
        .done(resolve)
        .fail(reject);
    });
}
