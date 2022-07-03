const Ajv = require("ajv");
const ajv = new Ajv();

const KEY_SCHEMA = {
    type: "object",
    required: ['key'],
    properties: {
        key: {type: "string"}
    }
}

const MAP_SCHEMA = {
    type: "object",
    patternProperties: {
        "^.*$": {type: "string"}
    }
};

const INDEX_SCHEMA = {
    type: "object",
    required: ['index'],
    properties: {
        total_num: {type: "number"},
        map_total: {type: "number"},
        map_num: {
            type: "array",
            items: {type: "number"}
        },
        map_list: {
            type: "array",
            items: {type: "string"}
        }
    }
}

const key_validator = ajv.compile(KEY_SCHEMA);
const map_validator = ajv.compile(MAP_SCHEMA);
const index_validator = ajv.compile(INDEX_SCHEMA);

module.exports = {key_validator,map_validator, index_validator}
