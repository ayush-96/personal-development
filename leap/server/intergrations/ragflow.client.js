require('dotenv').config();
const axios =require('axios');
const fs = require('fs')
const FormData = require('form-data')
const extractAndRemoveZip = require('../utils/unzip');
const path = require('path');
const { dataset_embedding_model, dataset_chunk_method } = require('../config/ragflow');

const API_KEY = process.env.RAGFLOW_API_KEY;
const BASE_URL = process.env.RAGFLOW_BASE_URL || 'http://localhost';

function wrapErr(ctx, err) {
    const status = err.response?.status;
    const body = err.response?.data;
    const message = body?.message || err.message || 'Upstream error';
    const e = new Error(`[${ctx}] ${message}`);
    e.status = status || 502;
    e.body = body || null;
    return e;
}

async function createDataset(name) {
    const url = `${BASE_URL}/api/v1/datasets`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    try {
        const body = {
            name: name,
            embedding_model: dataset_embedding_model,
            chunk_method: dataset_chunk_method,
        };
        const response = await axios.post(
            url,
            body,
            { headers }
        );
        return response.data.data.id;
    } catch (error) {
        throw wrapErr('RAGFlow createDataset failed', error);
    }
}

async function deleteDataset(dataset_id) {
    const apiUrl = `/api/v1/datasets`;
    const url = `${BASE_URL}${apiUrl}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    try {
        const body = {
            ids: [dataset_id]
        };
        const response = await axios.delete(url, { data: body, headers });
        return response.data;
    } catch (error) {
        throw wrapErr('RAGFlow deleteDataset failed', error);
    }
}

async function uploadFile({filePaths, dataset_id}) {
    const apiUrl = `/api/v1/datasets/${dataset_id}/documents`;
    const url = `${BASE_URL}${apiUrl}`;
    const form = new FormData();
    filePaths.forEach(filePath => {
        form.append('file', fs.createReadStream(filePath));
    });

    try {
        const headers = {
            ...form.getHeaders(),
            'Authorization': `Bearer ${API_KEY}`
        };
        const response = await axios.post(
            url,
            form,
            { headers }
        );
        return response.data;
    } catch (error) {
        throw wrapErr('RAGFlow uploadFile failed', error);
    }
}

async function listFile(dataset_id) {
    const apiUrl = `/api/v1/datasets/${dataset_id}/documents`;
    const url = `${BASE_URL}${apiUrl}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    try {
        const response = await axios.get(url, { headers });
        return response.data.data;
    } catch (error) {
        throw wrapErr('RAGFlow listFile failed', error);
    }
}

async function deleteFile({document_ids, dataset_id}) {
    const apiUrl = `/api/v1/datasets/${dataset_id}/documents`;
    const url = `${BASE_URL}${apiUrl}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    const body = {
        "ids": [document_ids]
    };
    try {
        const response = await axios.delete(url, {
            data: body,
            headers
        });
        return response.data;
    } catch (error) {
        throw wrapErr('RAGFlow deleteFile failed', error);
    }
}

async function parsingFile({document_ids, dataset_id}) {
    const apiUrl = `/api/v1/datasets/${dataset_id}/chunks`;
    const url = `${BASE_URL}${apiUrl}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }

    const body = {
        document_ids: document_ids
    };

    try {
        const response = await axios.post(
            url,
            body,
            { headers }
        );
        return response.data;
    } catch (error) {
        throw wrapErr('RAGFlow parsingFile failed', error);
    }
}

async function createChatAssistant({name, dataset_ids}) {
    const apiUrl = '/api/v1/chats';
    const url = `${BASE_URL}${apiUrl}`;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }

    try {
        const body = {
            name: name,
            dataset_ids: dataset_ids
        };
        const response = await axios.post(
            url,
            body,
            { headers }
        );
        // Log response for debugging
        console.log('RagFlow createChatAssistant response:', JSON.stringify(response.data, null, 2));
        // Ragflow returns nested structure: response.data.data or response.data
        return response.data.data || response.data;
    } catch (error) {
        console.error('RagFlow createChatAssistant error:', error.response?.data || error.message);
        throw wrapErr('RAGFlow createChatAssistant failed', error);
    }
}

async function deleteChatAssistant(chat_id) {
    const apiUrl = `/api/v1/chats/`;
    const url = `${BASE_URL}${apiUrl}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    const body = {
        ids: [chat_id]
    };
    try {
        const response = await axios.delete(url, { data: body, headers });
        return response.data;
    } catch (error) {
        throw wrapErr('RAGFlow deleteChatAssistant failed', error);
    }
}

async function createSession({chat_id, name}) {
    console.log('chat_id', chat_id);
    console.log('name', name);
    const apiUrl = `/api/v1/chats/${chat_id}/sessions`;
    const url = `${BASE_URL}${apiUrl}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    const body = {
        name: name
    };
    try {

        const response = await axios.post(url, body, { headers });
        console.log('response', response.data);
        return response.data.data;
    } catch (error) {
        throw wrapErr('RAGFlow createSession failed', error);
    }
}

async function listSession(chat_id) {
    const apiUrl = `/api/v1/chats/${chat_id}/sessions`;
    const url = `${BASE_URL}${apiUrl}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    try {
        const response = await axios.get(url, { headers });
        return response.data.data;
    } catch (error) {
        throw wrapErr('RAGFlow listSession failed', error);
    }
}

async function deleteSession({chat_id, session_id}) {
    const apiUrl = `/api/v1/chats/${chat_id}/sessions`;
    const url = `${BASE_URL}${apiUrl}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    const body = {
        ids: [session_id]
    };

    try {
        const response = await axios.delete(url, { data: body, headers });
        return response.data;
    } catch (error) {
        throw wrapErr('RAGFlow deleteSession failed', error);
    }
}

async function chatCompletion({chat_id, session_id, question, stream = false}) {
    const apiUrl = `/api/v1/chats/${chat_id}/completions`;
    const url = `${BASE_URL}${apiUrl}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    }
    const body = {
        question: question,
        stream: stream
    };
    if (session_id) {body.session_id = session_id;}

    try {
        const response = await axios.post(url, body, { headers });
        return response.data.data;
    } catch (error) {
        throw wrapErr('RAGFlow chatCompletion failed', error);
    }
}

// ✔ RagFlow takes the processed zip file
// ✔ Uploads the processed text to the provided dataset
// ✔ Parses the text
// Note: Does NOT create a dataset or chat assistant (uses existing dataset from space)
async function ragflow(storageKey, datasetId) { 
    // example storageKey: 1723315200000.pdf
    // datasetId: The RAGFlow dataset ID from the space
    const { name, ext } = path.parse(storageKey);
    const zipPath = path.resolve(__dirname, `../files/${name}.zip`);  // MinerU created this zip file
    const outputDir = path.resolve(__dirname, `../files/${name}`);  // Unzipped files will be stored here
    try {
        await extractAndRemoveZip.extractAndRemoveZip(zipPath, outputDir);

        // Upload the processed text in markdown file to the dataset
        const data = await uploadFile({filePaths: [`${outputDir}/full.md`], dataset_id: datasetId});
        const document_ids = [data.data[0].id];  // The document ID is used to parse the text

        await parsingFile({document_ids, dataset_id: datasetId});

        // Wait for parsing to complete
        let parsingComplete = false;
        while (!parsingComplete) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            const parsingStatus = await listFile(datasetId);
            const document = parsingStatus?.data?.docs?.find(doc => document_ids.includes(doc.id));
            if (document) {
                if (document.run !== 'RUNNING') {
                    parsingComplete = true;
                }
            } else {
                // Document not found, assume complete
                parsingComplete = true;
            }
        }

        return document_ids; // No chat assistant created
    } catch (err) {
        throw err;
    }
}

module.exports = {
    ragflow,
    createDataset,
    deleteDataset,
    uploadFile,
    listFile,
    deleteFile,
    parsingFile,
    createChatAssistant,
    deleteChatAssistant,
    createSession,
    listSession,
    deleteSession,
    chatCompletion,
};