//import { httpServer } from 'http/main';
import fs from 'fs';
import path from 'path';
import http from 'http';

const HTTP_PORT = 8181;

http
  .createServer(function (req, res) {
    const __dirname = path.resolve(path.dirname(''));
    const file_path =
      __dirname + (req.url === '/' ? '/front/index.html' : '/front' + req.url);
    console.log(file_path);
    fs.readFile(file_path, function (err, data) {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  })
  .listen(HTTP_PORT);

console.log(
  `Start static http server on the http://localhost:${HTTP_PORT}/ port!`,
);
