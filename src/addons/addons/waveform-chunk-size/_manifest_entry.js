/* generated by pull.js */
const manifest = {
  "noTranslations": true,
  "name": "High-quality sound editor waveform",
  "description": "Makes the quality of the sound editor's waveform preview configurable, at the cost of performance.",
  "credits": [
    {
      "name": "JeremyGamer13"
    },
    {
      "name": "SharkPool-SP",
      "link": "https://github.com/SharkPool-SP"
    },
  ],
  "userscripts": [
    {
      "url": "userscript.js"
    }
  ],
  "info": [
    {
      "text": "Lower numbers means more samples are used to make the waveform, which may impact performance to the point of crashing the editor.",
      "id": "qualityWarning"
    }
  ],
  "settings": [
    {
      "name": "Use every (n)th sample",
      "id": "quality",
      "type": "integer",
      "min": 1,
      "max": Number.MAX_SAFE_INTEGER,
      "default": 64
    }
  ],
  "dynamicEnable": true,
  "dynamicDisable": true,
  "enabledByDefault": false,
  "tags": [
    "new"
  ]
};
export default manifest;