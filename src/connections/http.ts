import * as path from "path";
import * as fs from "fs";
import getconfig from '../config';
const { HTTPS_KEY, HTTPS_CERT } = getconfig();

let httpserver: any;
export function serverInitialize(app: any) {
  try {
    console.log("HTTPS_KEY -->> ", HTTPS_KEY, " HTTPS_CERT -->> ", HTTPS_CERT);
    if (
      HTTPS_KEY && HTTPS_CERT &&
      fs.existsSync(path.join(__dirname + HTTPS_KEY)) &&
      fs.existsSync(path.join(__dirname + HTTPS_CERT))
    ) {
      var httpsOptions = {
        key: fs.readFileSync(path.join(__dirname + HTTPS_KEY)),
        cert: fs.readFileSync(path.join(__dirname + HTTPS_CERT)),
      };
      console.log(" certificate/Directory exists! :: start in ::--------->> https");
      httpserver = require("https").createServer(httpsOptions, app);
    } else {
      console.log(" certificate/Directory not exists! :: start in ::--------->> http");
      httpserver = require("http").Server(app);
    }
    return httpserver;

  } catch (error) {
    console.log(
      "ERROR : http server serverInitialize() :: Error :: ", error
    );
  }
}

export function getHttpServer(){
  return httpserver;
}
