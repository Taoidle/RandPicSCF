const AV = require('leanengine');
const ApiData = AV.Object.extend('ApiData');
const Query = new AV.Query('ApiData');
const _ = require("lodash");

const PAGE_ITEM = _.parseInt(process.env.PAGE_ITEM || 1000);

async function getKvIndex() {
    return new Promise(async resolve => {
        resolve(await isExistIndexKv());
    })
}

async function isKvExist(key) {
    return new Promise(async resolve => {
        Query.equalTo('api_key', key);
        const data = await Query.first();
        if (data === null) {
            resolve({'bool': false});
        } else {
            resolve({'bool': true, 'data': data});
        }
    });
}

async function updateKv(json_data) {
    const update_data = JSON.parse(JSON.stringify(json_data));
    const update_keys = Object.keys(update_data);
    const data = JSON.parse(JSON.stringify(await isExistIndexKv()));
    const index_data = data['data']['api_value'];
    let total_num = index_data['total_num'];
    let map_total = index_data['map_total'];
    let map_num = index_data['map_num'];
    let map_list = index_data['map_list'];
    let map_update = {};
    let map_kv = [];
    for (let i = 0; i < map_list.length; i++) {
        Query.equalTo('api_key', map_list[i]);
        const res = await Query.first();
        if (res !== undefined) {
            map_kv = _.union(map_kv, _.toArray(Object.keys(res['api_value'])));
        }
    }
    if (data['bool']) {
        for (let i = 0; i < update_keys.length; i++) {
            const key = update_keys[i]
            const value = update_data[update_keys[i]];
            let insert = true;
            if (map_kv.length !== 0) {
                if (_.findIndex(map_kv, key) !== -1) {
                    insert = false;
                }
            }
            if (insert) {
                const map_index = Math.floor(total_num / PAGE_ITEM);
                if (map_index >= map_total) {
                    const map_key = (await hashTimestamp()) + i.toString();
                    map_update[map_key] = {};
                    map_list.push(map_key);
                    map_num.push(0);
                    map_total += 1;
                }
                if (map_update[map_list[map_index]] === null) {
                    Query.equalTo('api_key', map_list[map_index]);
                    map_update[map_list[map_index]] = (await Query.first())['api_value'];
                }
                if (map_update[map_list[map_index]] === undefined) {
                    map_update[map_list[map_index]] = {};
                }
                map_update[map_list[map_index]][key] = {};
                map_update[map_list[map_index]][key] = value;
                map_num[map_index] += 1;
                map_kv = _.union(map_kv, [key]);
                total_num += 1;
            }
        }
    }
    const map_update_key = Object.keys(map_update);
    console.log("map_update", map_update);
    console.log("map_update_key", map_update_key);
    for (let i = 0; i < map_update_key.length; i++) {
        Query.equalTo('api_key', map_update_key[i]);
        const data = await Query.first();
        if (data !== undefined) {
            const update_data_id = (await Query.first()).id;
            const update_data = AV.Object.createWithoutData('ApiData', update_data_id);
            update_data.set('api_value', index_data);
            await update_data.save();
        } else {
            const update_data = new ApiData();
            update_data.set('api_key', map_update_key[i]);
            update_data.set('api_value', map_update[map_update_key[i]]);
            await update_data.save();
        }
    }
    index_data['total_num'] = total_num;
    index_data['map_total'] = map_total;
    index_data['map_num'] = map_num;
    index_data['map_list'] = map_list;
    Query.equalTo('api_key', 'KV_INDEX');
    const kv_index_id = (await Query.first()).id;
    const kv_index = AV.Object.createWithoutData('ApiData', kv_index_id);
    kv_index.set('api_value', index_data);
    await kv_index.save();
}

async function randKvValue() {
    return new Promise(async resolve => {
        const json_data = JSON.parse(JSON.stringify(await isExistIndexKv()));
        const data = json_data['data']['api_value']
        const r_index = _.random(data['total_num'], false);
        Query.equalTo('api_key', data['map_list'][Math.floor(r_index / PAGE_ITEM)]);
        const map = (await Query.first()).attributes['api_value'];
        resolve(map[Object.keys(map)[Math.floor(r_index % PAGE_ITEM) - 1]]);
    });
}

async function isExistIndexKv() {
    return new Promise(async resolve => {
        try {
            Query.equalTo('api_key', 'KV_INDEX');
            const data = await Query.first();
            if (data !== undefined) {
                return resolve({'bool': true, 'data': data});
            } else {
                return resolve(await initKvIndex());
            }
        } catch (e) {
            console.error("isExistIndexKv catch error");
            return resolve(await initKvIndex());
        }
    });
}

async function initKvIndex() {
    return new Promise(async resolve => {
        try {
            const api_data = new ApiData();
            const map_key = await hashTimestamp();
            const data = {
                total_num: 0,
                map_total: 1,
                map_num: [0],
                map_list: [map_key],
            }
            api_data.set('api_key', 'KV_INDEX');
            api_data.set('api_value', data);
            const res = await api_data.save();
            if (res === undefined) {
                resolve({'bool': true, 'data': res, 'msg': "index init success"})
            } else {
                resolve({'bool': false, 'data': res})
            }
        } catch (e) {
            console.error(e);
            console.error({error: "initKvIndex error"});
            resolve({'bool': false, 'error': e});
        }
    });

}

async function hashTimestamp() {
    const crypto = require('crypto');
    const timestamp = new TextEncoder().encode((Math.floor(Date.now() / 1000)).toString());
    return crypto.createHash('sha256').update(timestamp).digest('hex');
}

module.exports = {getKvIndex, isKvExist, updateKv, randKvValue};
