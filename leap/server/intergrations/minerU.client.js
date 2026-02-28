require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const stream = require('stream');

const API_KEY = process.env.MINERU_API_KEY;
const BASE_URL = process.env.MINERU_BASE_URL || 'https://mineru.net/api/v4';

function assertApiKey() {
    if (!API_KEY) throw new Error('MINERU_API_KEY is not set');
}

function wrapErr(ctx, err) {
    const status = err.response?.status;
    const body = err.response?.data;
    const message = body?.message || err.message || 'Upstream error';
    const e = new Error(`[${ctx}] ${message}`);
    e.status = status || 502;
    e.body = body || null;
    return e;
}

async function getUploadFileUrl({ name, language = 'en', layout_model = 'doclayout_yolo', extra = {} }){
    assertApiKey();
    const url = `${BASE_URL}/file-urls/batch`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    };
    const payload = {
        language,
        layout_model,
        ...extra,
        files: [
            { name, data_id: name }
        ]
    }

    try {
        const res = await axios.post(url, payload, { headers });
        return res.data.data;
    } catch (err) {
        throw wrapErr('getUploadFileUrl', err);
    }
}

async function uploadFile({uploadUrl, filePath}) {
    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(uploadUrl);
            const { size } = fs.statSync(filePath);

            const fileStream = fs.createReadStream(filePath);

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443, 
                path: urlObj.pathname + urlObj.search, 
                method: 'PUT',
                headers: {
                    'Content-Length': size
                    // if you want to specify the file type, you can add:
                    // 'Content-Type': 'application/pdf'
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                // accumulate response data
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                // response end
                res.on('end', () => {
                    // if the response code is 2xx, consider it as success, otherwise throw an error
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: responseData
                        });
                    } else {
                        const error = new Error(`Upload file failed, status code: ${res.statusCode}`);
                        error.statusCode = res.statusCode;
                        error.body = responseData;
                        reject(error);
                    }
                });
            });
            // request level error
            req.on('error', (err) => {
                reject(err);
            });

            // file stream error
            fileStream.on('error', (err) => {
                reject(err);
            });

            // pipe the file stream to the request body
            fileStream.pipe(req);
        } catch (err) {
            reject(err);
        }
    });
}

async function parsingFile(batch_id) {
    assertApiKey();
    const url = `${BASE_URL}/extract-results/batch/${batch_id}`;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    };
    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (err) {
        throw wrapErr('parsingFile', err);
    }
}

async function saveFile({fileUrl, filePath}) {
    const pipeline = promisify(stream.pipeline); 
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream' // stream the response data
        });

        const writer = fs.createWriteStream(filePath);

        await pipeline(response.data, writer);

        console.log('File downloaded successfully');
        return filePath;
    } catch (error) {
        throw wrapErr('saveFile', error);
    }
}

async function minerU({localFilePath, displayName, saveFilePath}) {
    try {
        
        console.log('Getting upload file url...');
        const { batch_id, file_urls } = await getUploadFileUrl({name: displayName});
        console.log('Upload file url got successfully');

        console.log('Uploading file...');
        await uploadFile({uploadUrl: file_urls[0], filePath: localFilePath});
        console.log('File uploaded successfully');

        console.log('Parsing file...');
        let parsingState = await parsingFile(batch_id);

        while (parsingState.data.extract_result[0].state !== 'done') {
            console.log('Parsing...');
            console.log(parsingState.data.extract_result[0]);
            if(parsingState.data.extract_result[0].state === 'failed') {
                throw new Error('Parsing failed');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            parsingState = await parsingFile(batch_id);
        }
        console.log('Parsing completed');
        
        const full_zip_url = parsingState.data.extract_result[0].full_zip_url;
        console.log(full_zip_url);
        console.log(saveFilePath);
        await saveFile({fileUrl: full_zip_url, filePath: saveFilePath});
        console.log('File saved successfully');
    } catch (error) {
        console.error('minerU parsing file failed:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    minerU,
    getUploadFileUrl,
    uploadFile,
    parsingFile,
    saveFile
};

/**
 * 
 * 
 * User -> Upload File -> MinerU -> RAGFlow Chat Assistant -> embeded URL Link -> User
 * 
 * 
 */