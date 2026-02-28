//const { createDataset } = require('./utils/datasetAPI');
//const { uploadFile, parsingFile, listFile} = require('./utils/fileAPI');
//const { createChatAssistant } = require('./utils/chatAPI');
const { getUploadFileUrl } = require('../routes/minerUAPI');
//const {ragflow} = require('./utils/ragFlowAPI.js');
const dotenv = require('dotenv');

dotenv.config();
const apikey = process.env.MINERU_API_KEY;
// tset createDataset
// (async () => {
//   try {
//     const id = await createDataset('leap_test');
//     console.log(id);
//   } catch (err) {
//     console.error('调用 createDataset 时出错:', err);
//   }
// })();

// test uploadFile
// (async () => {
//   try {
//     const files = ['./files/full.md'];
//     const dataset_id = '313a86fce8b911ef9a870242ac120006';
//     const data = await uploadFile(files, dataset_id);
//     console.log(data.data[0].id);
//   } catch (err) {
//     console.error('调用 createDataset 时出错:', err);
//   }
// })();


// test parsingFile
// (async () => {
//   try {
//     const document_ids = ['4b813790e8b911efac0f0242ac120006'];
//     const dataset_id = '313a86fce8b911ef9a870242ac120006';
//     const data = await parsingFile(document_ids, dataset_id);
//     console.log(data);
//   } catch (err) {
//     console.error('调用 createDataset 时出错:', err);
//   }
// })();


// // test listFile
// (async () => {
//   try {
//     const document_id = '4b813790e8b911efac0f0242ac120006';
//     const dataset_id = '313a86fce8b911ef9a870242ac120006';
//     const data = await listFile(document_id, dataset_id);
//     console.log(data.data.docs[0].run);
//   } catch (err) {
//     console.error('调用 createDataset 时出错:', err);
//   }
// })();


// // test createChatAssistant
// (async () => {
//   try {
//     const document_id = '4b813790e8b911efac0f0242ac120006';
//     const dataset_ids = ['313a86fce8b911ef9a870242ac120006'];
//     const data = await createChatAssistant('test_1', dataset_ids);
//     console.log(data.data.id);
//   } catch (err) {
//     console.error('调用 createChatAssistant 时出错:', err);
//   }
// })();


// test getUploadFileUrl
(async () => {
  try {
    const data = await getUploadFileUrl('test_1',apikey);
    console.log(data);
  } catch (err) {
    console.error('调用 getFileUrl 时出错:', err);
  }
})();


// // // // test minerU
// (async () => {
//   try {
//     await minerU('./public/upload/10733c65479f6992e63375a00.pdf','10733c65479f6992e63375a00.pdf','./files/10733c65479f6992e63375a00/10733c65479f6992e63375a00.zip');
//   } catch (err) {
//     console.error('调用 minerU 时出错:', err);
//   }
// })();


// // // test uploadFile
// (async () => {
//   try {
//     const res = await uploadFile('https://mineru.oss-cn-shanghai.aliyuncs.com/api-upload/6e8691a2-c87e-44d8-be80-b285d6ca9b3e/da00d0c1-f991-4f4b-9266-d24c9d8c162a.pdf?Expires=1739401321&OSSAccessKeyId=LTAI5t9nGwatk85zetzojXbn&Signature=5uNk2fngpVWUohwlxXhGmv7jgfY%3D','./public/upload/10733c65479f6992e63375a00.pdf');
//     console.log(res);
//   } catch (err) {
//     console.error('调用 minerU 时出错:', err);
//   }
// })();


// (async () => {
//   try {
//     const response = await parsingFile('9dc41fce-3af3-4ac2-931e-8d87ffa14403');
//     console.log(response.data.extract_result[0].state);
//   } catch (err) {
//     console.error('调用 minerU 时出错:', err);
//   }
// })();


// // // // test ragflow
// (async () => {
//   try {
//     await ragflow('10733c65479f6992e63375a00');
//   } catch (err) {
//     console.error('调用ragflow时出错:', err);
//   }
// })();