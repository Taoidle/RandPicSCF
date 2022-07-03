'use strict';
const router = require('express').Router();
const {getKvIndex, isKvExist, updateKv, randKvValue} = require("./func");
const {key_validator, map_validator} = require("./schema");

router.get('/', function (req, res, next) {
    res.send({
        msg: 'rand pic api is running'
    })
});

router.get('/kv_index', async function (req, res, next) {
    const kv_index = await getKvIndex();
    res.send(kv_index);
});

router.post('/kv_exist', async function (req, res, next) {
    try {
        const content = req.body;
        const json_data = JSON.parse(JSON.stringify(content));
        const result = key_validator(json_data);
        if (result) {
            const kv_keys = await isKvExist(json_data['key']);
            res.send(kv_keys);
        } else {
            res.send(r401());
        }
    } catch (e) {
        console.error(e);
        console.error("kv check exist error");
    }
});

router.post('/kv_update', async function (req, res, next) {
    try {
        const content = req.body;
        const json_data = JSON.parse(JSON.stringify(content));
        const result = map_validator(json_data);
        if (result) {
            await updateKv(json_data);
            res.send({msg: "ok"});
        } else {
            res.send(r401());
        }
    } catch (e) {
        console.error(e);
        console.log("kv update error");
    }

});

router.get('/img', async function (req, res, next) {
    try {
        const url = process.env.RAND_PIC_URL;
        const img_url = await randKvValue();
        const upyun_url = url + img_url;
        res.redirect(upyun_url);
    } catch (e) {
        console.log("kv rand value false");
    }
});

function r401() {
    return {
        statusCode: 401,
        msg: "type error"
    };
}

module.exports = router;
