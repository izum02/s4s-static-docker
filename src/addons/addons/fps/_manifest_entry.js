/* generated by pull.js */
const manifest = {
  "name": "FPS",
  "description": "FPS(処理速度)を常に表示します。",
  "tags": [
    "recommended"
  ],
  "userscripts": [
    {
      "url": "userscript.js"
    }
  ],
  "enabledByDefault": true
};
import {mediaRecorderSupported} from "../../environment";
if (!mediaRecorderSupported) manifest.unsupported = true;
export default manifest;