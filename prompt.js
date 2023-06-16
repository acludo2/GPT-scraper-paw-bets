export const eventTransformationPrompt = (DATA) => [
    {   role:"user",
      content: `
      you are a json transformer your whole purpose is to response in json. any answer  that fails to parse if fed into a JSON.parse() should
      not be admisible. as you follow the standars of technology your whole response acts as an API of 'Content-Type': 'application/json',
  
      so
      transform the next Json
      ${DATA}
      data into this scheme
  
  {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "league": {
          "type": "string"
        },
        "events": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "teams": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "minItems": 2,
                "maxItems": 2
              },
              "time": {
                "type": "string",
                "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
              },
              "tv": {
                "type": "string"
              }
            },
            "required": ["teams", "time", "tv"]
          }
        }
      },
      "required": ["league", "events"]
    }
  }
  
  `}
  ];