import { http } from "./http";

// {
//     "code": "OK",
//     "success": true,
//     "message": "Chat overview fetched",
//     "data": {
//         "spaceId": 11,
//         "assistants": {
//             "RagFlow": {
//                 "assistantId": "6abff682d85f11f087c20acb833b2743",
//                 "status": "ready",
//                 "sessions": [
//                     {
//                         "id": 5,
//                         "space_id": 11,
//                         "user_id": 3,
//                         "chat_assistant_id": 21,
//                         "ragflow_session_id": null,
//                         "title": "New RAG Session",
//                         "created_at": "2025-12-13T12:09:26.000Z",
//                         "updated_at": "2025-12-13T12:09:26.000Z",
//                         "isdeleted": 0
//                     }
//                 ]
//             },
//             "OpenAI": {
//                 "assistantId": "gpt-4o",
//                 "status": "ready",
//                 "sessions": [
//                     {
//                         "id": 6,
//                         "space_id": 11,
//                         "user_id": 3,
//                         "chat_assistant_id": 22,
//                         "ragflow_session_id": null,
//                         "title": "New Chat",
//                         "created_at": "2025-12-13T12:09:26.000Z",
//                         "updated_at": "2025-12-13T16:35:10.000Z",
//                         "isdeleted": 0
//                     }
//                 ]
//             }
//         }
//     }
// }
export const getChatOverview = async (spaceId) => {
    const res = await http.get(`/api/v1/chat/${spaceId}/overview`);
    return res;
};


// {
//     "code": "OK",
//     "success": true,
//     "message": "Session created",
//     "data": {
//         "id": 8,
//         "space_id": 11,
//         "user_id": 3,
//         "chat_assistant_id": 22,
//         "ragflow_session_id": null,
//         "title": "New chat",
//         "created_at": "2025-12-14T16:47:39.000Z",
//         "updated_at": "2025-12-14T16:47:39.000Z",
//         "isdeleted": 0,
//         "assistantType": "OpenAI",
//         "mode": "GENERAL"
//     }
// }
export const createChatSession = async (spaceId, mode) => {
    const body = {
        spaceId,
        mode,
    };
    const res = await http.post("/api/v1/chat/sessions", body);
    // http interceptor returns res.data, so res = { code, success, message, data: { session } }
    // Extract the data property to get the session object
    return res?.data || res;
};


// {
//     "code": "OK",
//     "success": true,
//     "message": "Session renamed",
//     "data": {
//         "id": 8,
//         "space_id": 11,
//         "user_id": 3,
//         "chat_assistant_id": 22,
//         "ragflow_session_id": null,
//         "title": "hello",
//         "created_at": "2025-12-14T16:47:39.000Z",
//         "updated_at": "2025-12-14T16:48:36.000Z",
//         "isdeleted": 0
//     }
// }
export const renameChatSession = async (sessionId, title) => {
    const body = {
        title,
    };
    const res = await http.put(`/api/v1/chat/sessions/${sessionId}`, body);
    // http interceptor returns res.data, so res = { code, success, message, data: { session } }
    // Extract the data property to get the session object
    return res?.data || res;
};



// {
//     "code": "OK",
//     "success": true,
//     "message": "Session deleted",
//     "data": null
// }
export const deleteChatSession = async (sessionId) => {
    const res = await http.delete(`/api/v1/chat/sessions/${sessionId}`);
    return res;
};


// {
//     "code": "OK",
//     "success": true,
//     "message": "Session messages fetched",
//     "data": [
//         {
//             "id": 19,
//             "session_id": 5,
//             "provider": "RagFlow",
//             "role": "user",
//             "content": "Please tell me about frequentist approach of probability?",
//             "model": null,
//             "external_message_id": null,
//             "tool_name": null,
//             "tool_call_id": null,
//             "prompt_tokens": null,
//             "completion_tokens": null,
//             "total_tokens": null,
//             "metadata": null,
//             "created_at": "2025-12-14T16:50:41.000Z"
//         },
//         {
//             "id": 20,
//             "session_id": 5,
//             "provider": "RagFlow",
//             "role": "assistant",
//             "content": "Sorry! No relevant content was found in the knowledge base!",
//             "model": null,
//             "external_message_id": null,
//             "tool_name": null,
//             "tool_call_id": null,
//             "prompt_tokens": null,
//             "completion_tokens": null,
//             "total_tokens": null,
//             "metadata": {
//                 "total": 0,
//                 "chunks": [],
//                 "doc_aggs": []
//             },
//             "created_at": "2025-12-14T16:50:41.000Z"
//         },
//         {
//             "id": 21,
//             "session_id": 5,
//             "provider": "RagFlow",
//             "role": "user",
//             "content": "Thank you!",
//             "model": null,
//             "external_message_id": null,
//             "tool_name": null,
//             "tool_call_id": null,
//             "prompt_tokens": null,
//             "completion_tokens": null,
//             "total_tokens": null,
//             "metadata": null,
//             "created_at": "2025-12-14T16:51:37.000Z"
//         },
//         {
//             "id": 22,
//             "session_id": 5,
//             "provider": "RagFlow",
//             "role": "assistant",
//             "content": "Sorry! No relevant content was found in the knowledge base!",
//             "model": null,
//             "external_message_id": null,
//             "tool_name": null,
//             "tool_call_id": null,
//             "prompt_tokens": null,
//             "completion_tokens": null,
//             "total_tokens": null,
//             "metadata": {
//                 "total": 0,
//                 "chunks": [],
//                 "doc_aggs": []
//             },
//             "created_at": "2025-12-14T16:51:37.000Z"
//         }
//     ]
// }
export const getSessionMessages = async (sessionId) => {
    const res = await http.get(`/api/v1/chat/sessions/${sessionId}/messages`);
    return res;
};


// {
//     "code": "OK",
//     "success": true,
//     "message": "Message sent",
//     "data": {
//         "sessionId": 5,
//         "provider": "RagFlow",
//         "ragflowSessionId": "11239b50d95011f0b85dd2478709594a",
//         "userMessage": {
//             "id": 19,
//             "session_id": 5,
//             "provider": "RagFlow",
//             "role": "user",
//             "content": "Please tell me about frequentist approach of probability?",
//             "model": null,
//             "external_message_id": null,
//             "tool_name": null,
//             "tool_call_id": null,
//             "prompt_tokens": null,
//             "completion_tokens": null,
//             "total_tokens": null,
//             "metadata": null,
//             "created_at": "2025-12-14T16:50:41.000Z"
//         },
//         "assistantMessage": {
//             "id": 20,
//             "session_id": 5,
//             "provider": "RagFlow",
//             "role": "assistant",
//             "content": "Sorry! No relevant content was found in the knowledge base!",
//             "model": null,
//             "external_message_id": null,
//             "tool_name": null,
//             "tool_call_id": null,
//             "prompt_tokens": null,
//             "completion_tokens": null,
//             "total_tokens": null,
//             "metadata": {
//                 "total": 0,
//                 "chunks": [],
//                 "doc_aggs": []
//             },
//             "created_at": "2025-12-14T16:50:41.000Z"
//         }
//     }
// }
export const sendSessionMessage = async (sessionId, content) => {
    const body = {
        content,
    };
    const res = await http.post(`/api/v1/chat/sessions/${sessionId}/messages`, body);
    return res;
};


// {
//     "code": "OK",
//     "success": true,
//     "message": "RagFlow assistant status fetched",
//     "data": {
//         "id": 3,
//         "spaceId": 2,
//         "assistantType": "RagFlow",
//         "assistantId": null,
//         "status": "creating",
//         "createdAt": "2025-12-11T00:09:03.000Z",
//         "updatedAt": "2025-12-11T00:09:03.000Z",
//         "enabled": false
//     }
// }
export const getRagflowStatus = async (spaceId) => {
    const res = await http.get(`/api/v1/chat/${spaceId}/ragflow-status`);
    return res;
};