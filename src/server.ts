import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

var validUrl = require('valid-url');

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // Filtered image endpoint
  app.get("/filteredimage", async ( req, res ) => {
    try {
      let { image_url } = req.query;

      // Check `image_url` is provided
      if (!image_url) {
        return res.status(400)
                  .send({error: "image_url is a required query parameter"});
      }
 
      // Check `image_url` is a valid URL
      if (!validUrl.isWebUri(image_url)) {
        return res.status(422)
                  .send({error: "image_url is not a valid url"});
      }

      // Process the image
      let filteredPath = await filterImageFromURL(image_url);
      if (filteredPath && filteredPath.length != 0) {
        // Add event listener to delete local files on completion
        res.on('finish', () => deleteLocalFiles([filteredPath]));

        // Return the filtered image
        return res.status(200)
                  .sendFile(filteredPath);
      } else {
        // Error filtering image
        return res.status(500)
                  .send({error: 'Error filtering image. If error continues please contact an administrator.'});
      }

    } catch (e) {
      // Error with the request
      console.log(e);
      return res.status(500)
                .send({error: "Error processing request. If error continues please contact an administrator."});
    }
  } );

  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    return res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();